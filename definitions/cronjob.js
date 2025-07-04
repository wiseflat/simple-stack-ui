SCHEDULE('* * * * *', function() {
    const current_day = new Date().setTimeZone('Europe/Paris').format('dddd');
    const current_hour = new Date().setTimeZone('Europe/Paris').format('h');
    const current_minute = new Date().setTimeZone('Europe/Paris').format('m');

    NOSQL('playbooks').find().where('cron', true).callback(function(err, response){
        response.wait(function(value, next) {
			if(value.cron_day.split(',').includes(current_day) && value.cron_hour.split(',').includes(current_hour) && value.cron_minute.split(',').includes(current_minute)){
				value.runners_id.wait(function(runner_id, next) {
					NOSQL('runner').one().where('id', runner_id).callback(function(err, runner){
						RESTBuilder.make(function(builder) {
							builder.method('POST');
							builder.url(runner.endpoint);
							builder.json(value.payload);
							if(runner.authentication){
								builder.auth(runner.login, runner.password);
							}
							builder.callback(function(err, response, output){
								next(err ? 'cancel' : '');
							});
						});
					});
				}, function(err){
					next();
				});
            }
            else {
                next();
            }
            
        }, () => console.log('DONE'));
    });
});