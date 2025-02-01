exports.calculateDateTime = () => {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
        timezone: 'ASIA/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    return formatter.format(new Date());
}

exports.calculateDateTime = (time) => {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
        timezone: 'ASIA/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    return formatter.format(time);
}