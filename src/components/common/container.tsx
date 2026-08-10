import { PropsWithChildren } from "react";
import { cn } from "../../lib/cn";

const Container = ({
  children,
  className,
}: PropsWithChildren & {
  className?: string;
}) => {
  return <div className={cn("mx-auto h-full w-full max-w-[1400px] px-4 sm:px-6 md:px-8 lg:px-16", className)}>{children}</div>;
};

export default Container;
