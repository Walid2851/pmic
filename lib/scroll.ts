export const scrollToId = (element_id: string) => {
  const element = document.getElementById(element_id);

  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
    });
  }
};
