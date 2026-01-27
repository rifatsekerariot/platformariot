import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export { dayjs };

/**
 * Default date time format
 */
export const DEFAULT_DATA_TIME_FORMAT = {
    /** Week start format */
    weekDateFormat: 'ddd',

    /** Simple date format */
    simpleDateFormat: 'YYYY-MM-DD',

    /** Date week format */
    fullDateFormat: 'YYYY-MM-DD ddd',

    /** Date time minute format */
    fullDateTimeMinuteFormat: 'YYYY-MM-DD HH:mm',

    /** Date time second format */
    fullDateTimeSecondFormat: 'YYYY-MM-DD HH:mm:ss',

    /** Date week time minute format */
    fullDateWeekTimeMinute: 'YYYY-MM-DD ddd HH:mm',

    /** Day week time minute format */
    monthDayWeekTimeMinute: 'MM-DD ddd HH:mm',

    /** Day minute format */
    monthDayTimeMinute: 'MM-DD HH:mm',

    /** Minute format */
    timeMinuteFormat: 'HH:mm',

    /** Second format */
    timeSecondFormat: 'HH:mm:ss',
} as const;

/**
 * Get the current device time zone
 */
export const getTimezone = () => {
    return dayjs.tz.guess();
};

/**
 * Change default timezone
 * @param timezone Time zone
 */
export const changeTimezone = (timezone: string) => {
    dayjs.tz.setDefault(timezone);
};

/**
 * Format date time
 * @param time Time
 * @param format Format
 */
export const format = (
    time: dayjs.ConfigType = dayjs(),
    format = DEFAULT_DATA_TIME_FORMAT.fullDateTimeSecondFormat,
) => {
    return dayjs(time).format(format);
};
