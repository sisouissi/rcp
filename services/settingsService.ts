
const RCP_DATE_KEY = 'rcp-next-date';
const RCP_EMAIL_KEY = 'rcp-email';

const getNextRcpDate = (): string => {
    return localStorage.getItem(RCP_DATE_KEY) || '';
};

const setNextRcpDate = (date: string): void => {
    if (date) {
        localStorage.setItem(RCP_DATE_KEY, date);
    } else {
        localStorage.removeItem(RCP_DATE_KEY);
    }
};

const getRcpEmail = (): string => {
    return localStorage.getItem(RCP_EMAIL_KEY) || '';
};

const setRcpEmail = (email: string): void => {
    if (email) {
        localStorage.setItem(RCP_EMAIL_KEY, email);
    } else {
        localStorage.removeItem(RCP_EMAIL_KEY);
    }
};


export const settingsService = {
    getNextRcpDate,
    setNextRcpDate,
    getRcpEmail,
    setRcpEmail,
};