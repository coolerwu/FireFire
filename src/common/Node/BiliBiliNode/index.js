import { mergeAttributes, Node, nodePasteRule } from '@tiptap/core'

const BiliBiliNode = Node.create({
    name: 'bilibili',

    addOptions() {
        return {
            addPasteHandler: true,
            allowFullscreen: false,
            controls: true,
            height: 480,
            HTMLAttributes: {},
            inline: false,
            nocookie: false,
            width: 640,
        }
    },

    inline() {
        return this.options.inline
    },

    group() {
        return this.options.inline ? 'inline' : 'block'
    },

    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            start: {
                default: 0,
            },
            width: {
                default: this.options.width,
            },
            height: {
                default: this.options.height,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-youtube-video] iframe',
            },
        ]
    },

    addCommands() {
        return {
            setBiliBiliVideo: options => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                })
            },
        }
    },

    addPasteRules() {
        if (!this.options.addPasteHandler) {
            return []
        }

        return [
            nodePasteRule({
                find: /^(https?:\/\/)?(www\.|player\.)?(bilibili\.com\/video\/)(BV[0-9a-zA-Z]*)[?/](.+)?$/g,
                type: this.type,
                getAttributes: match => {
                    return { src: match[4] }
                },
            }),
        ]
    },

    renderHTML({HTMLAttributes}) {
        // console.log(HTMLAttributes);



        const vid = HTMLAttributes.src;
        HTMLAttributes.src = `//player.bilibili.com/player.html?aid=342943207&bvid=${vid}&cid=761028385&page=1`

        return [
            'div',
            {'data-bilibili-video': vid},
            [
                'iframe',
                mergeAttributes(
                    this.options.HTMLAttributes,
                    {
                        width: this.options.width,
                        height: this.options.height,
                        allowfullscreen: this.options.allowFullscreen,
                    },
                    HTMLAttributes,
                ),
            ],
        ];
    },
});


export default BiliBiliNode;