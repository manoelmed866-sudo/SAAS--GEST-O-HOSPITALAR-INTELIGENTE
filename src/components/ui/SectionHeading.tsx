import type { ReactNode } from "react";

type SectionHeadingProps = {
  id?: string;
  title: string;
  children: ReactNode;
};

export function SectionHeading({ id, title, children }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <h2 id={id}>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
