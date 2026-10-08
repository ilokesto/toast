export const toasterStyles = `
          @keyframes toast-enter {
            0% { transform: translate3d(var(--toast-enter-x, 0), var(--toast-enter-y, -14px), 0) scale(0.96); opacity: 0; }
            100% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
          }
          @keyframes toast-exit {
            0% { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
            100% { transform: translate3d(var(--toast-exit-x, 0), var(--toast-exit-y, -10px), 0) scale(0.96); opacity: 0; }
          }
          @keyframes toast-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes toast-icon-circle {
            0% { transform: scale(0.72) rotate(45deg); opacity: 0; }
            100% { transform: scale(1) rotate(45deg); opacity: 1; }
          }
          @keyframes toast-icon-check {
            0% { width: 0; height: 0; opacity: 0; }
            45% { width: 6px; height: 0; opacity: 1; }
            100% { width: 6px; height: 10px; opacity: 1; }
          }
          @keyframes toast-icon-cross-first {
            0% { transform: translate(-50%, -50%) rotate(45deg) scale(0.6); opacity: 0; }
            100% { transform: translate(-50%, -50%) rotate(45deg) scale(1); opacity: 1; }
          }
          @keyframes toast-icon-cross-second {
            0% { transform: translate(-50%, -50%) rotate(-45deg) scale(0.6); opacity: 0; }
            100% { transform: translate(-50%, -50%) rotate(-45deg) scale(1); opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes toast-enter {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            @keyframes toast-exit {
              0% { opacity: 1; }
              100% { opacity: 0; }
            }
            .toast-motion-spin,
            .toast-motion-circle,
            .toast-motion-check,
            .toast-motion-cross-first,
            .toast-motion-cross-second { animation: none !important; }
          }
        `;
