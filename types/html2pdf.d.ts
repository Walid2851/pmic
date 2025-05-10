declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: { scale: number; useCORS: boolean; logging: boolean };
    jsPDF?: { unit: string; format: string; orientation: string; compress: boolean };
  }

  function html2pdf(): {
    set: (options: Html2PdfOptions) => any;
    from: (element: HTMLElement) => any;
    save: () => Promise<void>;
  };

  export default html2pdf;
} 