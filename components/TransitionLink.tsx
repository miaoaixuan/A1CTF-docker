"use client";
import Link, { LinkProps } from "next/link";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils"

interface TransitionLinkProps extends LinkProps {
    children: React.ReactNode;
    className?: string;
    href: string;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const TransitionLink: React.FC<TransitionLinkProps> = ({
    children,
    className,
    href,
    ...props
}) => {
    const router = useRouter();
    const currentURL = usePathname();

    const handleTransition = async (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) => {
        e.preventDefault();
        if (currentURL == href) return;

        const body = document.querySelector("body");

        body?.classList.add("page-transition");

        await sleep(200);
        router.push(href);
        await sleep(200);

        body?.classList.remove("page-transition");
    };

    return (
        <Link {...props} href={href} className={cn(className, "")} onClick={handleTransition}>
            {children}
        </Link>
    );
}