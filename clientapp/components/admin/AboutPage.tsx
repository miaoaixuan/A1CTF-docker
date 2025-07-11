import Editor, { Monaco } from '@monaco-editor/react';
import { Mdx } from 'components/MdxCompoents';
import { Button } from 'components/ui/button';
import { Save } from 'lucide-react';
import { MacScrollbar } from 'mac-scrollbar';
import { editor } from 'monaco-editor';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

export default function AboutPage() {

    const editorRef = useRef<any>(null);
    const [aboutMeSource, setAboutMeSource] = useState<string>("# about");
    const [debouncedSource, setDebouncedSource] = useState<string>("# about");
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 防抖函数
    const debouncedUpdateSource = useCallback((value: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSource(value);
        }, 1000);
    }, []);

    // 清理定时器
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
        editorRef.current = editor;
    }

    // 使用 useMemo 优化 Mdx 组件，只在 debouncedSource 改变时重新渲染
    const memoizedMdx = useMemo(() => {
        return <Mdx source={debouncedSource} />;
    }, [debouncedSource]);

    return (
        <div className='flex-1 overflow-hidden w-full flex flex-col'>
            <div className='w-full flex items-center px-5 py-4 justify-between'>
                <span className='font-bold text-2xl'>关于我们 - 编辑</span>
                <Button>
                    <Save />
                    保存
                </Button>
            </div>
            <div className='w-full h-full px-5 pb-4 overflow-hidden'>
                <div className="h-full w-full flex gap-4">
                    <div className='h-full w-1/2 bg-[#1e1e1e] pt-2 rounded-md overflow-hidden'>
                        <Editor
                            height="100%"
                            width="100%"
                            defaultLanguage="markdown"
                            theme='vs-dark'
                            defaultValue={aboutMeSource}
                            onChange={(value) => {
                                const newValue = value || "";
                                setAboutMeSource(newValue);
                                debouncedUpdateSource(newValue);
                            }}
                            onMount={handleEditorDidMount}
                        />
                    </div>
                    <div className='h-full w-1/2 border-2 rounded-md overflow-hidden relative'>
                        <div className='absolute top-0 left-0 px-2 bg-foreground text-background rounded-br-lg select-none z-10'>
                            <span>Preview - 1s latency</span>
                        </div>
                        <MacScrollbar className='h-full w-full select-none'>
                            <div className='p-4 px-6'>
                                {memoizedMdx}
                            </div>
                        </MacScrollbar>
                    </div>
                </div>
            </div>
        </div>
    )
}