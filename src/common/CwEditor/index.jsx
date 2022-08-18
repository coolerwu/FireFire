import React from "react";
import {EditorState} from "prosemirror-state";
import {EditorView} from "prosemirror-view";
import {keymap} from "prosemirror-keymap";
import {splitBlock} from "prosemirror-commands";
import {defaultMarkdownParser, defaultMarkdownSerializer, schema} from "prosemirror-markdown";
import {exampleSetup} from "prosemirror-example-setup";
import './index.less';

class CwEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: null,
            editorView: null,
            rootRef: React.createRef(),
            cwjson: props.cwjson,
        }
    }

    componentDidMount() {
        window.electronAPI.readNotebookFile(this.state.cwjson.filename).then(content => {
            // editor.commands.setContent(content ? JSON.parse(content) : null);
            // schema.node( {
            //     content: "inline*",
            //     group: "block",
            //     parseDOM: [{tag: "p"}],
            //     toDOM() { return ["p", 0] }
            // })
            const plugins = exampleSetup({
                schema,
                history: true,
                floatingMenu: true,
                menuBar: false
            });
            plugins.push(keymap({'Tab': splitBlock}));
            const rootDiv = this.state.rootRef.current;
            const editorState = EditorState.create({
                doc: defaultMarkdownParser.parse(content),
                plugins: plugins,
                // plugins: [
                //     schema,
                //     // exampleSetup({schema}),
                //     history(),
                //     keymap({'Mod-z': undo, 'Mod-y': redo}),
                //     keymap({'Tab': indent}),
                //     keymap(baseKeymap),
                // ],
            });
            const editorView = new EditorView(rootDiv, {
                state: editorState,
                dispatchTransaction: (tr) => {
                    console.log("Document size went from", tr.before.content.size, "to", tr.doc.content.size)
                    let newState = this.state.editorView.state.apply(tr);
                    // newState.reconfigure()
                    // newState.schema = new Schema({
                    //     nodes: {
                    //         doc: {content: "paragraph+"},
                    //         paragraph: {
                    //             content: "text*",
                    //             toDOM(node) { return ["p", 0] }
                    //         },
                    //         text: {}
                    //     }
                    // })
                    // console.log(defaultMarkdownSerializer.serialize(this.state.editorView.state.doc));
                    window.electronAPI.writeNotebookFile(this.state.cwjson.filename, defaultMarkdownSerializer.serialize(this.state.editorView.state.doc));
                    this.state.editorView.updateState(newState);
                }
            });

            this.setState({editorState, editorView})
        })
    }

    render() {
        return (
            <>
                <div ref={this.state.rootRef} id={'CwEditorRoot'}></div>
            </>
        )
    }
}

export default CwEditor;