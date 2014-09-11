	$(document).ready(function() {

		// праздничные дни для календаря
		var holidaysOnCalendar = InitializeHolidaysOnCalendar();

		// события в календаре в формате json
		var jsonEvents = InitializeDataForCalendar();
  		var holidayEvents = []; // отпуска
  		var dayoffEvents = [];  // отгула
		jsonEvents.forEach(function(obj){
			switch(obj.daystype)
			{
				case 'holidays':
					holidayEvents.push(obj);
					break;
				case 'dayoff':
					dayoffEvents.push(obj);
					break;
			}
		});

		// производственный календарь
		$('#calendar').fullCalendar({
			theme: true,
			header: {
				left: 'prev,next today',
				center: 'title',
				right: 'basicYear,basicQuarter,month,basicWeek'
			},
			defaultDate: '2014-09-12',
			editable: false,
			eventLimit: true, // ссылка, если событий в одном дне 'много'
			lang: 'ru',
			showHolidays: true,

			eventMouseover: function(calEvent, jsEvent) {
				// формируем подсказки при наведении на событие в календаре
				var tooltipStyle = 'style="width:115px;' +
								   'color:#fff;' +
								   'opacity:0.5;' +
								   'border-radius:3px;' +
								   'font-weight:normal;' +
								   'position:absolute;' +
								   'z-index:10001;'
				var tooltipColor = 'black'; // default background color for tooltip
				var tooltipDescription = '';
				if(calEvent.daystype == 'dayoff') {

					tooltipColor = '#ff8f66'; // orange
					tooltipDescription = '<br>Отгул: ' + moment(calEvent.start._d).format('D.MM');
					tooltipDescription += (calEvent.halfday == 'true') ? '<br>Полдня' : '';


				} else if(calEvent.daystype == 'holidays') {

					tooltipColor = '#88b7cd'; // blue
					var startDay = calEvent.start ? moment(calEvent.start._d).format('D.MM') : '';
					var endDay = calEvent.end ? moment(calEvent.end._d).add(-1, 'days').format('D.MM') : startDay;
					tooltipDescription = '<br>Отпуск: <br>' + startDay + ' - ' + endDay;
				}

			    var tooltip = '<div class="tooltipevent"' + tooltipStyle + 'background:' + tooltipColor + '">' +
			    	calEvent.title  + tooltipDescription + '</div>';
			    $("body").append(tooltip);
			    $(this).mouseover(function(e) {
			        $(this).css('z-index', 10000);
			        $('.tooltipevent').fadeIn('500');
			        $('.tooltipevent').fadeTo('10', 1.9);
			    }).mousemove(function(e) {
			        $('.tooltipevent').css('top', e.pageY + 10);
			        $('.tooltipevent').css('left', e.pageX + 20);
			    });
			},

			eventMouseout: function(calEvent, jsEvent) {
			    $(this).css('z-index', 8);
			    $('.tooltipevent').remove();
			},

			eventAfterRender: function(event, element, view) {

				// отступы для наглядного отображения отпусков и отгулов на квартальном и годовом календаре
				if(view.name == 'basicYear' || view.name == 'basicQuarter'){
					var startDate = event.start ? event.start._d : null;
					var endDate = event.end ? event.end._d : null;
					var column = $('.fc-day-grid .fc-day').first();
					var widthCol = column.width(); // ширина колонки на квартальном/годовом календаре

					var daysInStartMonth = startDate ? moment(startDate).daysInMonth() : 0; // кол-во дней в 'стартовом' месяце
					var daysInEndMonth = endDate ? moment(endDate).daysInMonth() : 0;		// кол-во дней в 'конечном' месяце

					// (День начала / кол-во дней в этом месяце)*ширина столбца = получаем нужный отступ для начальной даты
					var startMargin = daysInStartMonth > 0 && (startDate instanceof Date) ? ((startDate.getDate()-1)/daysInStartMonth)*widthCol : 0;

					// (День окончания / кол-во дней в этом месяце)*ширина столбца = получаем нужный отступ для конечной даты
					var endMargin = daysInEndMonth > 0 && (endDate instanceof Date) ? ((daysInEndMonth - endDate.getDate())/daysInEndMonth)*widthCol : 0;

					// немного магии
					if(view.name == 'basicQuarter'){
						// период квартала
						var startPeriodDate = view.intervalStart ? view.intervalStart._d : null;
						var endPeriodMonth = view.intervalEnd ? view.intervalEnd._d : null;

						// если отпуск начался раньше, чем текущий квартал, отступ для начальной даты в текущем квартале не ставим
						if(startDate != null && startDate < startPeriodDate){
							startMargin = 0;
						}

						// если отпуск заканчивается позже, чем текущий квартал, отступ для конечной даты в текущем квартале не ставим
						if(endDate != null && endDate >= endPeriodMonth) {
							endMargin = 0;
						}
					}

					// Отступы для начальной и конечной даты
					$(element).css('margin-left', startMargin +'px');
					if(endDate != null) {
						$(element).css('margin-right', endMargin +'px');
					} else {

						// для отгулов (дата окончания не указана)
						endMargin = daysInStartMonth > 0 ? ((daysInStartMonth - startDate.getDate())/daysInStartMonth)*widthCol : 0;
						$(element).css('margin-right', endMargin +'px');
					}
				}

				// если отгул на полдня -> width = width/2
				if(event.halfday == 'true'){
					var width = $(element).width();
					width = width / 2;
					$(element).css('width', width + 'px');
				}
			  },

			viewRender: function(view, element) {
				// для вкладки Месяц и Неделя выделяем праздничные дни
				if(view.name != 'basicYear' && view.name != 'basicQuarter') {

					holidaysOnCalendar.forEach(function(obj){
						$('.fc-day[data-date=' + obj.date + ']').css('background', '#fb7e90');
					});
				}
			},

			events: jsonEvents // load data for calendar
		});


		// --------------- кнопки фильтрации событий: отпуска и отгулы ---------------

		// Отпуск
		$('#holidayCheck').iCheck({
			checkboxClass: 'icheckbox_square-blue',
			increaseArea: '20%' // optional
		});

		// Отгул
		$('#dayoffCheck').iCheck({
			checkboxClass: 'icheckbox_square-red',
			increaseArea: '20%' // optional
		});

		/* --------------- event handlers --------------- */

		// Отпуск - checked
		$('#holidayCheck').on('ifChecked', function(event){
			// добавляем отпуска
          	$('#calendar').fullCalendar('addEventSource', holidayEvents);
          	$('#calendar').fullCalendar('refetchEvents');
		});

		// Отпуск - unchecked
		$('#holidayCheck').on('ifUnchecked', function(event){
			// удаляем все события с календаря
  			$('#calendar').fullCalendar('removeEvents');
  			$('#calendar').fullCalendar('refetchEvents');
  			var dayoffIsChecked = $('#dayoffCheck').is(':checked');

  			// если отгула были на календаре, возвращаем их
  			if(dayoffIsChecked){
  				$('#calendar').fullCalendar('addEventSource', dayoffEvents);
          		$('#calendar').fullCalendar('refetchEvents');
  			}
		});

		// Отгул - checked
		$('#dayoffCheck').on('ifChecked', function(event){
			// добавляем отгула
          	$('#calendar').fullCalendar('addEventSource', dayoffEvents);
          	$('#calendar').fullCalendar('refetchEvents');
		});

		// Отгул - unchecked
		$('#dayoffCheck').on('ifUnchecked', function(event){
			// удаляем все события с календаря
  			$('#calendar').fullCalendar('removeEvents');
  			$('#calendar').fullCalendar('refetchEvents');
  			var holidayIsChecked = $('#holidayCheck').is(':checked');

  			// если отпуска были на календаре, возвращаем их
  			if(holidayIsChecked){
  				$('#calendar').fullCalendar('addEventSource', holidayEvents);
          		$('#calendar').fullCalendar('refetchEvents');
  			}
		});

	});

	// Праздничные дни в году
	function InitializeHolidaysOnCalendar(){
		var jsonHolidays = [
			{
				date: '2014-01-01'
			},
			{
				date: '2014-01-02'
			},
			{
				date: '2014-01-03'
			},
			{
				date: '2014-02-23'
			},
			{
				date: '2014-03-08'
			},
			{
				date: '2014-05-01'
			},
			{
				date: '2014-05-09'
			},
			{
				date: '2014-06-12'
			},
			{
				date: '2014-09-01'
			}
		];
		return jsonHolidays;
	}

	// Отпуска и отгулы сотрудников
	function InitializeDataForCalendar(){
		var jsonData = [
				{
					id: 1,
					title: 'Иванов И.И.',
					start: '2014-10-15',
					daystype: 'dayoff'
				},
				{
					id: 2,
					title: 'Петров М.И.',
					start: '2014-07-01',
					end: '2014-07-02',
					daystype: 'holidays'
				},
				{
					id: 3,
					title: 'Сидоров В.В.',
					start: '2014-08-02',
					end: '2014-08-05',
					daystype: 'holidays'
				},
				{
					id: 4,
					title: 'Путин В.В.',
					start: '2014-09-01',
					daystype: 'dayoff'
				},
				{
					id: 5,
					title: 'Обама Б.Б.',
					start: '2014-08-08',
					end: '2014-09-20',
					daystype: 'holidays'
				},
				{
					id: 999,
					title: 'Меркель А.А.',
					start: '2014-09-09',
					daystype: 'dayoff',
					halfday: 'true'
				},
				{
					id: 43,
					title: 'Жириновский В.В.',
					start: '2014-09-20',
					end: '2014-10-10',
					daystype: 'holidays'
				},
				{
					id: 10,
					title: 'Зюганов Г.А.',
					start: '2014-09-11',
					end: '2014-09-12',
					daystype: 'holidays'
				},
				{
					id: 10,
					title: 'Медведев Д.А.',
					start: '2014-09-12',
					end: '2014-09-13',
					daystype: 'holidays'
				},
				{
					id: 11,
					title: 'Миронов С.П.',
					start: '2014-09-12',
					end: '2014-09-13',
					daystype: 'dayoff'
				},
				{
					id: 13,
					title: 'Усама Б.Л.',
					start: '2014-09-12',
					end: '2014-09-15',
					daystype: 'holidays'
				},
				{
					id: 14,
					title: 'Бэтмен С.Б.',
					start: '2013-09-12',
					daystype: 'dayoff',
					halfday: 'true'
				},
				{
					id: 15,
					title: 'Порошенко П.П.',
					start: '2015-09-12',
					end: '2015-09-18',
					daystype: 'holidays'
				}
		];

		jsonData.forEach(function(item){
			item.color = 'black';
			if(item.daystype == 'dayoff'){
				item.color = '#FF4500'; // orange
			} else if(item.daystype == 'holidays'){
				item.color = '#3a87ad'; // blue
			}

		});

		return jsonData;
	}