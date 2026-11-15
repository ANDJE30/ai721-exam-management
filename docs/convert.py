#!/usr/bin/env python3
"""Ouvre un .docx dans LibreOffice, met à jour le sommaire, exporte le PDF et réenregistre le DOCX avec le sommaire rempli."""
import os, subprocess, sys, time, tempfile
import uno
from com.sun.star.beans import PropertyValue

def prop(n, v):
    p = PropertyValue(); p.Name = n; p.Value = v; return p

def main(paths):
    prof = tempfile.mkdtemp(prefix='lo-')
    env = dict(os.environ, SAL_USE_VCLPLUGIN='svp')
    proc = subprocess.Popen(['soffice', '--headless', '--invisible', '--norestore', '--nologo', f'-env:UserInstallation=file://{prof}', '--accept=socket,host=127.0.0.1,port=2083;urp;'], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ctx = None
    local = uno.getComponentContext(); resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
    for _ in range(60):
        try: ctx = resolver.resolve('uno:socket,host=127.0.0.1,port=2083;urp;StarOffice.ComponentContext'); break
        except Exception: time.sleep(1)
    if ctx is None: raise SystemExit('LibreOffice ne répond pas')
    desktop = ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
    try:
        for p in paths:
            url = uno.systemPathToFileUrl(os.path.abspath(p))
            doc = desktop.loadComponentFromURL(url, '_blank', 0, (prop('Hidden', True),))
            for _ in range(2):
                idx = doc.getDocumentIndexes()
                for i in range(idx.getCount()): idx.getByIndex(i).update()
                doc.refresh()
            base = os.path.splitext(os.path.abspath(p))[0]
            doc.storeToURL(uno.systemPathToFileUrl(base + '.pdf'), (prop('FilterName', 'writer_pdf_Export'),))
            doc.storeToURL(uno.systemPathToFileUrl(base + '.docx'), (prop('FilterName', 'MS Word 2007 XML'), prop('Overwrite', True)))
            doc.close(True)
            print('ok', base + '.pdf')
    finally:
        try: desktop.terminate()
        except Exception: pass
        time.sleep(1); proc.kill()

if __name__ == '__main__':
    main(sys.argv[1:])
