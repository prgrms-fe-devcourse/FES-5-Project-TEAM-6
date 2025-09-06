import Swal from "sweetalert2";

export const showInfoAlert = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    iconColor: '#e0ab0f',
    confirmButtonColor: '#e0ab0f',
    customClass: {
      popup: 'my-swal-popup',
      confirmButton: 'my-confirm-button',
      icon: 'custom-icon-background',
    },
    didOpen: () => {
      const iconContent = document.querySelector('.swal2-icon.swal2-info .swal2-icon-content');
      if (iconContent instanceof HTMLElement) {
        iconContent.style.color = '#e0ab0f';
      }
    }

  });
};

/* warning */
export const showWarningAlert = (
  title: string,
  text?: string,
  confirmButtonText?: string,
  cancelButtonText?: string
) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    iconColor: '#D22811',
    showCancelButton: true,
    confirmButtonColor: '#D22811',
    confirmButtonText,
    cancelButtonColor: '#3F3F3F',
    cancelButtonText,
    customClass: {
      popup: 'my-swal-popup',
      confirmButton: 'my-confirm-button',
      icon: 'custom-icon-background',
      cancelButton: 'my-confirm-button'
    },
    didOpen: () => {
      const iconContent = document.querySelector('.swal2-icon.swal2-warning .swal2-icon-content');
      if (iconContent instanceof HTMLElement) {
        iconContent.style.color = '#D22811';
      }
    }
  })
}


