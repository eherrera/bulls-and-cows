var game = {
	states : {
		playing : 1,
		inTheEnd : 2
	},
	initialized : false,
	databaseLoaded : false,
	defaultConfig : {
		digits : 4,
		opportunities : 8
	},
	closeDialog : function(el) {
		$('.ui-dialog').dialog('close');
		// document.location.href="index.html";
	},
	init : function() {
		if (!this.initialized) {
			$('div[data-role="dialog"]').live('pagebeforeshow',
					function(e, ui) {
						ui.prevPage.addClass("ui-dialog-background ");
					});

			$('div[data-role="dialog"]').live(
					'pagehide',
					function(e, ui) {
						$(".ui-dialog-background ").removeClass(
								"ui-dialog-background ");
					});
			this.config = this.defaultConfig;
			this.state = this.states.playing;
			this.number = this.generateNumber(this.config.digits);
			this.clearAll();
			this.initialized = true;
		}
	},
	drawHistory : function() {
		for (number in this.history) {
			this.generateResult(number, this.history[number]);
		}
	},
	loadFromDatabase : function(dbHistory) {
		var times = this.times;
		if (dbHistory && dbHistory.state != 0) {
			this.history = jQuery.parseJSON(dbHistory.history);
			times = Object.keys(this.history).length;
			if (times > 0) {
				this.number = dbHistory.number;
				this.state = dbHistory.state;
				this.times = times;
				this.drawHistory();
			}
		}
	},
	getNextEmptyPlaceId : function() {
		for (i = 1; i <= this.config.digits; i++)
			if ($('#number-' + i).text() == '_')
				return '#number-' + i;
		return '';
	},
	digitExists : function(dig) {
		for (i = 1; i <= this.config.digits; i++)
			if ($('#number-' + i).text() == dig)
				return true;
		return false;
	},
	canAssignValue : function(value) {
		var placeId = this.getNextEmptyPlaceId();
		var placePos = placeId[placeId.length - 1] - 1;
		return placeId != '' && (placePos + value > 0)
				&& !this.digitExists(value);
	},
	assignValue : function(value) {
		if (this.canAssignValue(value)) {
			$(this.getNextEmptyPlaceId()).text(value);
		}
	},
	onDigitBtnClick : function(btn) {
		var digit = btn.id.substr(btn.id.length - 1, 1);
		this.assignValue(digit);
	},
	clearValues : function() {
		for (i = 1; i <= this.config.digits; i++)
			this.clearValue('#number-' + i);
	},
	clearValue : function(id) {
		$(id).text('_');
	},
	clearElValue : function(el) {
		this.clearValue('#' + el.id);
	},
	newGame : function() {
		if (this.state == this.states.playing) {
			GAME_STORAGE.savePointHist(new GAME_STORAGE.PointHist({
				pointsAmmount : -this.times
			}));
		}
		this.initialized = false;
		this.init();
		GAME_STORAGE.saveGameLastState(new GAME_STORAGE.GameLastState({
			history : JSON.stringify(game.history),
			number : this.number,
			state : this.state
		}));
	},
	clearAll : function() {
		this.clearValues();
		this.times = 0;
		this.history = {};// model
		$(".ui-grid-d").remove();// view
	},
	getNumberAsText : function() {
		var result = '';
		for (i = 1; i <= this.config.digits; i++)
			if ($('#number-' + i).text() != '_')
				result = result + $('#number-' + i).text();
		return result;
	},
	validNumber : function(number) {
		return number.length == this.config.digits;
	},
	generateRandomNumber : function(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	},
	generateNumber : function(digCount) {
		if (digCount > 9 || digCount <= 0)
			return null;
		var number = "";
		n = this.generateRandomNumber(1, 9);
		number = number + n;
		do {
			n = this.generateRandomNumber(0, 9);
			if (number.indexOf(n) == -1)
				number = number + n;
		} while (number.length < digCount);
		return number;
	},
	generateResult : function(number, classif) {
		var aAscii = 97;// a ASCII
		var html = '<div class="ui-grid-d">';// FIXME put only one grid and
		// append blocks to it
		for (i = aAscii; i < aAscii + this.config.digits; i++)
			html = html
					+ '<div class="ui-block-'
					+ String.fromCharCode(i)
					+ '"><div class="ui-bar ui-bar-e" style="text-align:center;">'
					+ number[i - aAscii] + '</div></div>';
		html = html + '<div class="ui-block-e"><div class="ui-bar ui-bar-b">'
				+ classif + '</div></div>';
		html = html + '</div>';
		$('#target').after(html);
	},
	categorizeNumber : function(number) {
		var tCount = 0;
		var vCount = 0;
		var result = "";
		for (i = 0; i < number.length; i++) {
			for (j = 0; j < this.number.length; j++) {
				if (number[i] == this.number[j]) {
					if (i == j) {
						tCount++;
					} else {
						vCount++;
					}
					continue;
				}
			}
		}

		for (i = 0; i < tCount; i++) {
			result = result + "T";
		}
		for (i = 0; i < vCount; i++) {
			result = result + "V";
		}
		return result;
	},
	tryGuess : function() {
		var number = this.getNumberAsText();
		if (this.state != this.states.playing) {
			this.newGame();
		}
		var category = "";
		var win = false;
		var dialog = null;
		var ph = null;
		if (this.validNumber(number)) {
			this.times++;
			category = this.categorizeNumber(number);
			if (category == "")
				category = '-';
			this.history[number + '_' + this.times] = category;
			if (category == "TTTT")
				win = true;
			this.generateResult(number, category);
			this.clearValues();
		}
		if ((this.config.opportunities == this.times) && !win) {
			dialog = $(this.generateDialogHtml("Juego Perdido",
					'Usted ha alcanzado la m&#225;xima cantidad de intentos, el resultado es: '
							+ this.number + '.'));
			ph = new GAME_STORAGE.PointHist({
				pointsAmmount : -this.config.opportunities
			});
		}
		if (win) {
			dialog = $(this.generateDialogHtml("Enhorabuena",
					"Felicidades!! Ud ha adivinado el n&#250;mero."));
			ph = new GAME_STORAGE.PointHist({
				pointsAmmount : this.config.opportunities - this.times + 1
			});
		}

		if (dialog != null) {
			dialog.appendTo($.mobile.pageContainer);
			$.mobile.changePage(dialog);
			GAME_STORAGE.savePointHist(ph);
			this.state = this.states.inTheEnd;
		}

		GAME_STORAGE.saveGameLastState(new GAME_STORAGE.GameLastState({
			history : JSON.stringify(game.history),
			number : this.number,
			state : this.state
		}));
	},
	generateDialogHtml : function(title, body, id, theme) {
		id = typeof id == 'undefined' ? '' : 'id="' + id + '"';
		theme = typeof theme == 'undefined' ? 'b' : theme;
		return '<div data-role="dialog" ' + id + ' data-theme="' + theme + '">'
				+ '<div data-role="header" data-theme="' + theme + '">'
				+ '<h4>' + title + '</h4>' + '</div>'
				+ '<div data-role="content">'
				+ '<p style="text-align: center;">' + body + '</p>' + '</div>'
				+ '</div>';
	},
	aboutUs : function() {
		// Create page markup
		var about = $(this
				.generateDialogHtml("Acerca de...",
						"Desarrollado por: Ernesto Herrera Morales - ernestoh2006@gmail.com."));
		// Add page to page container
		about.appendTo($.mobile.pageContainer);
		// Enhance and open new page
		$.mobile.changePage(about);
	}
};

$(document).ready(function() {
	game.init();
});

$(document).on('onpointschange', function(e, params) {
	$('#pnt-wrapper .ui-btn-text').text(e.originalEvent.points);
});

$(document).on('onhistoryloaded', function(e, params) {
	// load last game state
	game.loadFromDatabase(e.originalEvent.dbHistory);
});

$(window).bind("beforeunload", function() {
	// nothing to do
});
