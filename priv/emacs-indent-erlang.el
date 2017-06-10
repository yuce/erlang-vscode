;;; File: emacs-indent-erlang
;;; adapted from http://www.cslab.pepperdine.edu/warford/BatchIndentationEmacs.html

;; this has to be set to the real path on your system
(setq erlang-emacs-path
      (let* ((cover-path
              (shell-command-to-string
               "erl -eval 'io:format(\"~s~n\", [code:which(cover)]), halt().' -noshell"))
             (tools-ebin (file-name-directory cover-path))
             (tools-path (file-name-directory (directory-file-name tools-ebin)))
             (emacs-path (concat (file-name-as-directory tools-path) "emacs")))
        emacs-path))

(add-to-list 'load-path erlang-emacs-path)
(load-library "erlang")
(setq create-lockfiles nil)
(setq make-backup-files nil)

;; comment out the call to untabify if you want the mixed tabs and spaces

(defun emacs-indent-function ()
 "Format the whole buffer."
 (erlang-mode)
 (indent-region (point-min) (point-max) nil)
 (untabify (point-min) (point-max))
 (delete-trailing-whitespace)
 (princ (buffer-string)))

