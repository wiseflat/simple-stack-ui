// Update softwares version
SCHEDULE('* * * * *', function() {
    const current_day = new Date().setTimeZone('Europe/Paris').format('dddd');
    const current_hour = new Date().setTimeZone('Europe/Paris').format('h');
    const current_minute = new Date().setTimeZone('Europe/Paris').format('m');

	CALL('Playbooks --> list').user({ sa: true }).callback(function(err, response) {
		for (const item of response) {
			if(item.cron && item.cron_day.split(',').includes(current_day) && item.cron_hour.split(',').includes(current_hour) && item.cron_minute.split(',').includes(current_minute))
				CALL('Playbooks --> run').params({ id: item.id }).user({ sa: true }).promise();
		}
	});
});

// Upgrade domains
SCHEDULE('* * * * *', function() {
	// Get a list of all domains
	CALL('Domain --> list').user({ sa: true }).callback(function(err, response) {
		for (const item of response) {
			for (const [key, value] of Object.entries(item.domains)) {
				// Redeploy domain if versions mismatches
				if(value.status !== 'destroyed' && value.version != value.software_version)
					CALL('Domain --> redeploy', { name: value.name }).params({ id: value.id }).user({ sa: true }).promise();
			}
		}
	});
});