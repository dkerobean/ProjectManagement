import Modal from 'react-modal'
import classNames from 'classnames'
import CloseButton from '../CloseButton'
import { motion } from 'framer-motion'
import useWindowSize from '../hooks/useWindowSize'
import type ReactModal from 'react-modal'
import type { MouseEvent } from 'react'

export interface DialogProps extends ReactModal.Props {
    closable?: boolean
    contentClassName?: string
    height?: string | number
    onClose?: (e: MouseEvent<HTMLSpanElement>) => void
    width?: number
}

const Dialog = (props: DialogProps) => {
    const currentSize = useWindowSize()

    const {
        bodyOpenClassName,
        children,
        className,
        closable = true,
        closeTimeoutMS = 150,
        contentClassName,
        height,
        isOpen,
        onClose,
        overlayClassName,
        portalClassName,
        style,
        width = 520,
        ...rest
    } = props

    const onCloseClick = (e: MouseEvent<HTMLSpanElement>) => {
        onClose?.(e)
    }

    const renderCloseButton = (
        <CloseButton
            absolute
            className="ltr:right-6 rtl:left-6 top-4.5"
            onClick={onCloseClick}
        />
    )

    const contentStyle = {
        content: {
            inset: 'unset',
            margin: currentSize.width && currentSize.width <= 768 ? '16px' : '0',
            borderRadius: currentSize.width && currentSize.width <= 768 ? '12px' : undefined,
        },
        ...style,
    }

    if (width !== undefined) {
        contentStyle.content.width = width

        if (
            typeof currentSize.width !== 'undefined' &&
            currentSize.width <= 768
        ) {
            contentStyle.content.width = 'calc(100vw - 32px)'
            contentStyle.content.maxWidth = 'calc(100vw - 32px)'
        } else if (
            typeof currentSize.width !== 'undefined' &&
            currentSize.width <= width
        ) {
            contentStyle.content.width = 'auto'
        }
    }

    if (height !== undefined) {
        contentStyle.content.height = height
        
        if (
            typeof currentSize.height !== 'undefined' &&
            currentSize.height <= 600
        ) {
            contentStyle.content.maxHeight = 'calc(100vh - 32px)'
            contentStyle.content.overflow = 'auto'
        }
    } else if (
        typeof currentSize.height !== 'undefined' &&
        currentSize.height <= 600
    ) {
        contentStyle.content.maxHeight = 'calc(100vh - 32px)'
        contentStyle.content.overflow = 'auto'
    }

    const defaultDialogContentClass = 'dialog-content'

    const dialogClass = classNames(defaultDialogContentClass, contentClassName)

    return (
        <Modal
            className={{
                base: classNames('dialog', className as string),
                afterOpen: 'dialog-after-open',
                beforeClose: 'dialog-before-close',
            }}
            overlayClassName={{
                base: classNames('dialog-overlay', overlayClassName as string),
                afterOpen: 'dialog-overlay-after-open',
                beforeClose: 'dialog-overlay-before-close',
            }}
            portalClassName={classNames('dialog-portal', portalClassName)}
            bodyOpenClassName={classNames('dialog-open', bodyOpenClassName)}
            ariaHideApp={false}
            isOpen={isOpen}
            style={{ ...contentStyle }}
            closeTimeoutMS={closeTimeoutMS}
            {...rest}
        >
            <motion.div
                className={classNames(dialogClass, 'touch-manipulation')}
                initial={{ 
                    transform: currentSize.width && currentSize.width <= 768 ? 'translateY(20px)' : 'scale(0.9)',
                    opacity: 0
                }}
                animate={{
                    transform: isOpen ? (currentSize.width && currentSize.width <= 768 ? 'translateY(0)' : 'scale(1)') : (currentSize.width && currentSize.width <= 768 ? 'translateY(20px)' : 'scale(0.9)'),
                    opacity: isOpen ? 1 : 0
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                {closable && renderCloseButton}
                {children}
            </motion.div>
        </Modal>
    )
}

Dialog.displayName = 'Dialog'

export default Dialog
