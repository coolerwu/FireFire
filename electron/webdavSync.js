/**
 * WebDAV 同步模块
 * 支持坚果云、Nextcloud 等 WebDAV 服务
 */

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { ipcMain } = require('electron');
const { getCurSettingConfig } = require('./settingFile');

/**
 * 发送 WebDAV 请求
 */
const webdavRequest = (options, body = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(options.url);
        const isHttps = url.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const reqOptions = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + (url.search || ''),
            method: options.method || 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${options.username}:${options.password}`).toString('base64'),
                ...options.headers,
            },
        };

        const req = httpModule.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data,
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
};

/**
 * 检查远程目录是否存在
 */
const checkRemoteDir = async (config, remotePath) => {
    try {
        const response = await webdavRequest({
            url: config.serverUrl + remotePath,
            method: 'PROPFIND',
            username: config.username,
            password: config.password,
            headers: {
                'Depth': '0',
                'Content-Type': 'application/xml',
            },
        });
        return response.status === 207 || response.status === 200;
    } catch (err) {
        return false;
    }
};

/**
 * 创建远程目录
 */
const createRemoteDir = async (config, remotePath) => {
    const response = await webdavRequest({
        url: config.serverUrl + remotePath,
        method: 'MKCOL',
        username: config.username,
        password: config.password,
    });
    return response.status === 201 || response.status === 405; // 405 means already exists
};

/**
 * 上传文件到 WebDAV
 */
const uploadFile = async (config, localPath, remotePath) => {
    const content = await fsPromises.readFile(localPath);
    const response = await webdavRequest({
        url: config.serverUrl + remotePath,
        method: 'PUT',
        username: config.username,
        password: config.password,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': content.length,
        },
    }, content);
    return response.status === 201 || response.status === 204 || response.status === 200;
};

/**
 * 从 WebDAV 下载文件
 */
const downloadFile = async (config, remotePath, localPath) => {
    const response = await webdavRequest({
        url: config.serverUrl + remotePath,
        method: 'GET',
        username: config.username,
        password: config.password,
    });

    if (response.status === 200) {
        // 确保本地目录存在
        const localDir = path.dirname(localPath);
        await fsPromises.mkdir(localDir, { recursive: true });
        await fsPromises.writeFile(localPath, response.data);
        return true;
    }
    return false;
};

/**
 * 列出远程目录内容
 */
const listRemoteDir = async (config, remotePath) => {
    const response = await webdavRequest({
        url: config.serverUrl + remotePath,
        method: 'PROPFIND',
        username: config.username,
        password: config.password,
        headers: {
            'Depth': '1',
            'Content-Type': 'application/xml',
        },
    }, '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop><getlastmodified/><getcontentlength/><resourcetype/></prop></propfind>');

    if (response.status !== 207) {
        return [];
    }

    // 简单解析 XML 响应获取文件列表
    const files = [];
    const hrefRegex = /<D:href>([^<]+)<\/D:href>/gi;
    const matches = response.data.matchAll(hrefRegex);

    for (const match of matches) {
        const href = decodeURIComponent(match[1]);
        // 跳过目录本身
        if (href !== remotePath && href !== remotePath + '/') {
            files.push(href);
        }
    }

    return files;
};

/**
 * 递归获取本地文件列表
 */
const getLocalFiles = async (dirPath, baseDir = dirPath) => {
    const files = [];
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (entry.isDirectory()) {
            // 递归获取子目录文件
            const subFiles = await getLocalFiles(fullPath, baseDir);
            files.push(...subFiles);
        } else {
            files.push({
                localPath: fullPath,
                relativePath: relativePath,
            });
        }
    }

    return files;
};

/**
 * 同步上传
 */
const syncUpload = async (config, onProgress) => {
    const settingConfig = getCurSettingConfig();
    const localNotebookPath = settingConfig.notebookPath;

    if (!fs.existsSync(localNotebookPath)) {
        throw new Error('本地笔记目录不存在');
    }

    // 确保远程目录存在
    const remotePath = config.remotePath.endsWith('/') ? config.remotePath : config.remotePath + '/';
    const exists = await checkRemoteDir(config, remotePath);
    if (!exists) {
        await createRemoteDir(config, remotePath);
    }

    // 获取所有本地文件
    const localFiles = await getLocalFiles(localNotebookPath);
    const total = localFiles.length;
    let completed = 0;

    for (const file of localFiles) {
        const remoteFilePath = remotePath + file.relativePath.replace(/\\/g, '/');

        // 确保远程子目录存在
        const remoteDir = path.dirname(remoteFilePath);
        if (remoteDir !== remotePath.slice(0, -1)) {
            await createRemoteDir(config, remoteDir + '/');
        }

        await uploadFile(config, file.localPath, remoteFilePath);
        completed++;

        if (onProgress) {
            onProgress(Math.round((completed / total) * 100));
        }
    }

    return { success: true, uploaded: completed };
};

/**
 * 同步下载
 */
const syncDownload = async (config, onProgress) => {
    const settingConfig = getCurSettingConfig();
    const localNotebookPath = settingConfig.notebookPath;

    // 确保本地目录存在
    await fsPromises.mkdir(localNotebookPath, { recursive: true });

    const remotePath = config.remotePath.endsWith('/') ? config.remotePath : config.remotePath + '/';

    // 获取远程文件列表
    const remoteFiles = await listRemoteDir(config, remotePath);
    const total = remoteFiles.length;
    let completed = 0;

    for (const remoteFile of remoteFiles) {
        // 计算本地路径
        const relativePath = remoteFile.replace(remotePath, '');
        if (!relativePath || relativePath.endsWith('/')) {
            completed++;
            continue; // 跳过目录
        }

        const localPath = path.join(localNotebookPath, relativePath);
        await downloadFile(config, remoteFile, localPath);
        completed++;

        if (onProgress) {
            onProgress(Math.round((completed / total) * 100));
        }
    }

    return { success: true, downloaded: completed };
};

/**
 * 初始化 WebDAV IPC 处理器
 */
exports.init = () => {
    // 测试 WebDAV 连接
    ipcMain.handle('webdav-test', async (event, config) => {
        try {
            const exists = await checkRemoteDir(config, '/');
            return { success: exists, error: exists ? null : '无法连接到服务器' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    // WebDAV 同步
    ipcMain.handle('webdav-sync', async (event, options) => {
        const { direction, serverUrl, username, password, remotePath } = options;

        const config = {
            serverUrl: serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl,
            username,
            password,
            remotePath: remotePath || '/firefire/',
        };

        try {
            if (direction === 'upload') {
                const result = await syncUpload(config);
                return { success: true, ...result };
            } else if (direction === 'download') {
                const result = await syncDownload(config);
                return { success: true, ...result };
            } else {
                return { success: false, error: '未知的同步方向' };
            }
        } catch (err) {
            console.error('[WebDAV] 同步失败:', err);
            return { success: false, error: err.message };
        }
    });

    console.log('[WebDAV] IPC handlers initialized');
};
