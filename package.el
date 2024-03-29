#!/usr/bin/emacs --script

(require 'org)

(defun make-html()
  "Export all org files to html. This expects files to have #+EXPORT_FILE_NAME: set correctly."
  (let ((org-files (directory-files-recursively "." (rx ".org"))))
    (mapcar (lambda (file)
              (let ((default-directory (file-name-directory (expand-file-name file))))
                (with-temp-buffer
                  (insert-file-contents (file-name-nondirectory file))
                  (org-html-export-to-html)))) org-files)))

(defun make-zip()
  "Pack up everything that should be part of the extension in a zip file. Zip
output will be available in the *zip* buffer."
  (let ((zip-files (directory-files-recursively "." (rx (or ".html" ".js" ".json" ".png" "icons" "LICENSE")))))
    (apply #'call-process "zip" nil "*zip*" nil "-r" "-FS" "../Emacs-keybinding.zip" (append zip-files))))

(message "Building html pages...")
(make-html)
(message "Building zip...")
(make-zip)
