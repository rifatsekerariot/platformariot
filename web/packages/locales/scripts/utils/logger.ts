/* eslint-disable no-console */
import chalk from 'chalk';

export const logger = {
    verbose: true,
    log: (...arg: any) => {
        if (logger.verbose) {
            console.log(...arg);
        }
    },
    success: (...arg: any) => {
        if (logger.verbose) {
            console.log(chalk.green(...arg));
        }
    },
    info: (...arg: any) => {
        if (logger.verbose) {
            console.log(chalk.cyan(...arg));
        }
    },
    error: (...arg: any) => {
        console.log(chalk.red(...arg));
    },
    warning: (...arg: any) => {
        console.log(chalk.yellow(...arg));
    },
};
