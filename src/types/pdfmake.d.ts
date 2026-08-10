declare module 'pdfmake/build/pdfmake' {
  interface PdfMakeStatic {
    vfs: Record<string, string>
    createPdf(docDefinition: unknown): {
      download(filename?: string): void
      getBuffer(cb: (buffer: ArrayBuffer) => void): void
    }
  }

  const pdfMake: PdfMakeStatic
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: Record<string, string> & {
    pdfMake?: { vfs?: Record<string, string> }
  }
  export default pdfFonts
}
