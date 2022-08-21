import {Node, nodePasteRule} from '@tiptap/core'

const BiliBiliNode = Node.create({
    name: 'url',

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
                tag: 'div[data-url] iframe',
            },
        ]
    },

    addCommands() {
        return {
            setBiliBiliVideo: options => ({commands}) => {
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
                find: /^(https?:\/\/)?(.+)?$/g,
                type: this.type,
                getAttributes: match => {
                    return { src: match.input }
                },
            }),
        ]
    },

    renderHTML({node, HTMLAttributes}) {
        console.log({node, HTMLAttributes})
        return [
            'div',
            {
                'data-url': HTMLAttributes.src,
                'style': "border: 1px solid gray"
            },
            HTMLAttributes.src + '11111111'
        ];
    },
});


export default BiliBiliNode;