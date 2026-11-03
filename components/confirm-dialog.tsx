"use client";

import { useState } from "react";
import {
    AlertTriangle,
    ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
    style: "warn" | "danger";
    onCertain: () => void;
    title: string;
    triggerChildren:React.ReactNode
};

export function ConfirmDialog({
    style,
    onCertain,
    title,
    triggerChildren
}: ConfirmDialogProps) {
    const [open, setOpen] = useState(false);

    const isDanger = style === "danger";

    const handleContinue = () => {
        setOpen(false);
        onCertain();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>{triggerChildren}</DialogTrigger>
            <DialogContent className="sm:max-w-md max-w-md overflow-hidden rounded-2xl border-border/70 p-0">
                <div
                    className={`h-1.5 w-full ${isDanger ? "bg-destructive" : "bg-amber-500"
                        }`}
                />

                <div className="space-y-10 p-6">
                    <DialogHeader className="gap-4 text-left">
                        <div
                            className={`flex size-12 items-center justify-center rounded-xl ${isDanger
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}
                        >
                            {isDanger ? (
                                <ShieldAlert className="size-6" aria-hidden="true" />
                            ) : (
                                <AlertTriangle className="size-6" aria-hidden="true" />
                            )}
                        </div>

                        <DialogTitle className="text-xl font-semibold tracking-tight">
                            {title}
                        </DialogTitle>

                        <DialogDescription className="text-lg leading-6">
                            {isDanger
                                ? "This action may have serious consequences. Review your decision before continuing."
                                : "Please review this action carefully before continuing."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={handleContinue}
                            className={`w-full sm:w-auto ${isDanger
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "bg-amber-500 text-white hover:bg-amber-600"
                                }`}
                        >
                            Continue
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}