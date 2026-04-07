export function StatusBadge({ status }: { status: string }) {
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
            {status}
        </span>
    );
}
