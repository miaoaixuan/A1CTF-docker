import React from "react";
import { cn } from "lib/utils";
import { useTransitionContext } from "contexts/TransitionContext";
import { useLocation, useNavigate } from "react-router";

interface TransitionLinkProps {
    children: React.ReactNode;
    className?: string;
    href: string;
}

export const TransitionLink: React.FC<TransitionLinkProps> = ({
    children,
    className,
    href,
    ...props
}) => {
    const router = useNavigate();
    const currentURL = useLocation().pathname;
    const { startTransition } = useTransitionContext();

    const handleTransition = async (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
        e.preventDefault();
        if (currentURL === href) return;

        startTransition(() => {
            router(href);
        });
    };

    return (
        <a {...props} href={href} className={cn(className, "")} onClick={handleTransition}>
            {children}
        </a>
    );
};

