export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mobile-page-transition w-full">
      {children}
    </div>
  );
}
