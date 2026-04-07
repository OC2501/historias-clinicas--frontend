import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { 
    Bold, 
    Italic, 
    Underline as UnderlineIcon, 
    List, 
    ListOrdered, 
    Quote, 
    Undo, 
    Redo,
    Heading1,
    Heading2,
    Table as TableIcon,
    Plus,
    Minus,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    compact?: boolean;
}

const MenuButton = ({ 
    active, 
    onClick, 
    children, 
    title,
    compact
}: { 
    active?: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    title: string;
    compact?: boolean;
}) => (
    <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
            "transition-colors shrink-0",
            compact ? "h-7 w-7" : "h-8 w-8",
            active ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-muted"
        )}
        onClick={onClick}
        title={title}
    >
        {children}
    </Button>
);

export function RichTextEditor({ value, onChange, placeholder, className, compact = false }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: placeholder || 'Empiece a escribir la historia médica...',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose dark:prose-invert focus:outline-none max-w-none p-3 lg:p-4 outline-none",
                    "prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
                    compact ? "prose-sm" : "prose-sm sm:prose-base",
                    compact ? "min-h-[120px]" : "min-h-[300px]"
                ),
            },
        },
    });

    if (!editor) return null;

    return (
        <div className={cn(
            "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
            className
        )}>
            {/* Toolbar style Word */}
            <div className={cn(
                "flex items-center gap-0.5 border-b bg-muted/30 relative", 
                compact ? "p-1 overflow-x-auto scrollbar-hide flex-nowrap" : "p-1.5 flex-wrap"
            )}>
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleBold().run()} 
                    active={editor.isActive('bold')}
                    title="Negrita"
                    compact={compact}
                >
                    <Bold className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleItalic().run()} 
                    active={editor.isActive('italic')}
                    title="Cursiva"
                    compact={compact}
                >
                    <Italic className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleUnderline().run()} 
                    active={editor.isActive('underline')}
                    title="Subrayado"
                    compact={compact}
                >
                    <UnderlineIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>
                
                <div className="w-px h-5 bg-border mx-1 shrink-0" />
                
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                    active={editor.isActive('heading', { level: 1 })}
                    title="Título 1"
                    compact={compact}
                >
                    <Heading1 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                    active={editor.isActive('heading', { level: 2 })}
                    title="Título 2"
                    compact={compact}
                >
                    <Heading2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>
                
                <div className="w-px h-5 bg-border mx-1 shrink-0" />
                
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleBulletList().run()} 
                    active={editor.isActive('bulletList')}
                    title="Lista con viñetas"
                    compact={compact}
                >
                    <List className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                    active={editor.isActive('orderedList')}
                    title="Lista numerada"
                    compact={compact}
                >
                    <ListOrdered className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>
                <MenuButton 
                    onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                    active={editor.isActive('blockquote')}
                    title="Cita"
                    compact={compact}
                >
                    <Quote className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>
                
                <div className="w-px h-5 bg-border mx-1 shrink-0" />

                <MenuButton 
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
                    active={false}
                    title="Insertar Tabla"
                    compact={compact}
                >
                    <TableIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                </MenuButton>

                {editor.isActive('table') && (
                    <>
                        <MenuButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Añadir fila" active={false} compact={compact}>
                            <Plus className="h-3 w-3 mr-0.5" /><div className="text-[10px]">F</div>
                        </MenuButton>
                        <MenuButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Añadir columna" active={false} compact={compact}>
                            <Plus className="h-3 w-3 mr-0.5" /><div className="text-[10px]">C</div>
                        </MenuButton>
                        <MenuButton onClick={() => editor.chain().focus().deleteTable().run()} title="Borrar tabla" active={false} compact={compact}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </MenuButton>
                    </>
                )}
                
                <div className="ml-auto flex items-center gap-0.5 shrink-0 pl-1">
                    <MenuButton onClick={() => editor.chain().focus().undo().run()} active={false} title="Deshacer" compact={compact}>
                        <Undo className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().redo().run()} active={false} title="Rehacer" compact={compact}>
                        <Redo className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                    </MenuButton>
                </div>
            </div>

            {/* Editor sheet */}
            <div className="bg-muted/5 overflow-y-auto">
                <EditorContent 
                    editor={editor} 
                    className={cn(
                        "bg-background w-full outline-none",
                        !compact && "mx-auto my-4 max-w-4xl shadow-sm border rounded-sm"
                    )} 
                />
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .tiptap p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .tiptap table {
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                    margin: 0;
                    overflow: hidden;
                }
                .tiptap td, .tiptap th {
                    min-width: 1em;
                    border: 2px solid #ced4da;
                    padding: 3px 5px;
                    vertical-align: top;
                    box-sizing: border-box;
                    position: relative;
                }
                .tiptap th {
                    font-weight: bold;
                    text-align: left;
                    background-color: #f8f9fa;
                }
            `}} />
        </div>
    );
}
