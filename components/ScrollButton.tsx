"use client";

import { scrollToId } from "@/lib/scroll";
import { Button } from "./ui/button";

const ScrollButton = ({
  value,
  scrollElementId,
}: {
  value: string;
  scrollElementId: string;
}) => {
  return <Button onClick={() => scrollToId(scrollElementId)}>{value}</Button>;
};

export default ScrollButton;
