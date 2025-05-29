import React from 'react'
import { ResizablePanel } from "components/ui/resizable"
import { ComponentProps } from 'react'

type ResizablePanelProps = ComponentProps<typeof ResizablePanel>

interface ResizableScrollablePanelProps extends ResizablePanelProps {
    children: React.ReactNode
}

export function ResizableScrollablePanel({ children, ...props }: ResizableScrollablePanelProps) {
    return (
        <ResizablePanel {...props}>
            <div className="h-full overflow-auto">
                {children}
            </div>
        </ResizablePanel>
    )
}
