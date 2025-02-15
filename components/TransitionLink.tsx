"use client";

import Link, { LinkProps } from "next/link";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTransitionContext } from "@/contexts/TransitionContext";

interface TransitionLinkProps extends LinkProps {
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
    const router = useRouter();
    const currentURL = usePathname();
    const { startTransition } = useTransitionContext();

    const handleTransition = async (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
        e.preventDefault();
        if (currentURL === href) return;

        startTransition(() => {
            router.push(href);
        });
    };

    return (
        <Link {...props} href={href} className={cn(className, "")} prefetch={false} onClick={handleTransition}>
            {children}
        </Link>
    );
};

