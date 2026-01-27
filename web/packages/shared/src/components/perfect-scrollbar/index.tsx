import React, { memo } from 'react';
import usePerfectScrollbar, { SCROLLBAR_WIDTH, type Options } from './usePerfectScrollbar';
import styles from './style.module.css';

type PerfectScrollbarProps = Options & {
    className?: string;
    innerClassName?: string;
    style?: React.CSSProperties;
    ref?: React.RefObject<HTMLDivElement>;
    children?: React.ReactNode;
};

const cx = (...args: (string | undefined)[]) => args?.filter(Boolean).join(' ');

/**
 * Virtual Scrollbar Component
 *
 * Hide the scrollbar in normal state, show the scrollbar when hovering.
 */
const PerfectScrollbar: React.FC<PerfectScrollbarProps> = memo(
    ({
        disabled,
        className,
        innerClassName,
        shouldUpdateKey,
        innerRef,
        innerStyles,
        children,
        ...props
    }) => {
        const [wrapperProps, scrollerProps, trackProps] = usePerfectScrollbar(children, {
            disabled,
            shouldUpdateKey,
            innerRef,
            innerStyles,
        });

        return (
            <div className={cx(className, styles.main)} {...props}>
                <div className={styles.wrapper} {...wrapperProps}>
                    <div className={cx(innerClassName, styles.inner)} {...scrollerProps}>
                        {children}
                    </div>
                </div>
                <div className={styles.track} {...trackProps} />
            </div>
        );
    },
);

PerfectScrollbar.displayName = 'PerfectScrollbar';

export { SCROLLBAR_WIDTH };
export default PerfectScrollbar;
