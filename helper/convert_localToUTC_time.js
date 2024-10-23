function convertLocalTimeToUTC(localTime) {
    if (localTime && localTime != null) {
        const [hours, minutes, seconds = '00'] = localTime.split(':');
        const now = new Date();
        now.setHours(hours);
        now.setMinutes(minutes);
        now.setSeconds(seconds);
        const utcHours = now.getUTCHours().toString().padStart(2, '0');
        const utcMinutes = now.getUTCMinutes().toString().padStart(2, '0');
        const utcSeconds = now.getUTCSeconds().toString().padStart(2, '0');
        return `${utcHours}:${utcMinutes}:${utcSeconds}`;
    } else {
        return ""
    }
}

module.exports=convertLocalTimeToUTC;