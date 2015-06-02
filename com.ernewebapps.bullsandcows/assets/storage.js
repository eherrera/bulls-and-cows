GAME_STORAGE = {
	GameLastState : function(params) {
		params = jQuery.extend({
			playDate : null,
			history : "",
			number : "",
			numberPlace : "",
			state : 0
		}, params);
		var strDate = params.playDate ? new Date(params.playDate) : new Date();
		strDate = GAME_STORAGE.getStrDate(strDate);
		var self = {
			id : null,
			playDate : strDate,
			history : params.history,
			number : params.number,
			numberPlace : params.numberPlace,
			state : params.state
		};
		return self;
	},
	PointHist : function(params) {
		params = jQuery.extend({
			playDate : null,
			pointsAmmount : 0
		}, params);
		// initialize self
		var strDate = params.playDate ? new Date(params.playDate) : new Date();
		strDate = GAME_STORAGE.getStrDate(strDate);
		var self = {
			id : null,
			playDate : strDate,
			pointsAmmount : params.pointsAmmount
		};
		return self;
	},
	init : function() {
		if (window.openDatabase) {
			// open/create a database for the application (expected size ~ 100K)
			this.db = window.openDatabase("game", "1.0",
					"Store game history and user experience.", 100 * 1024);
			// check that we have the required tables created
			this.db
					.transaction(function(transaction) {
						// transaction.executeSql("DROP TABLE gamelaststate;");
						transaction
								.executeSql("CREATE TABLE IF NOT EXISTS pointhist("
										+ " playDate DATE NOT NULL, "
										+ " pointsAmmount INTEGER);");
						transaction
								.executeSql("CREATE TABLE IF NOT EXISTS gamelaststate("
										+ " playDate DATE NOT NULL, "
										+ " number TEXT, history TEXT, numberPlace TEXT, state INTEGER);");
					});
			this.savePointHist(new this.PointHist());
			this.pEvent = document.createEvent('HTMLEvents');
			this.hEvent = document.createEvent('HTMLEvents');
			this.pEvent.initEvent('onpointschange', false, true);
			this.hEvent.initEvent('onhistoryloaded', false, true);
			this.computeTotalPoints();
			this.loadGameLastState();
		}
	},
	getStrDate : function(date) {
		return (date.getDate() < 10 ? "0" + date.getDate() : date.getDate())
				+ '/'
				+ (date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date
						.getMonth() + 1) + '/' + date.getFullYear();
	},
	supportStorage : function() {
		return window.openDatabase != undefined;
	},
	computeTotalPoints : function(date) {
		var self = this;
		self.points = -1;
		if (!this.supportStorage()) {
			return self.points;
		}
		self.db.readTransaction(function(t) {
			t.executeSql('SELECT sum(pointsAmmount) AS total FROM pointhist',
					[ /* getStrDate(new Date()) */], function(t, r) {
						self.points = r.rows.item(0).total;
						self.pEvent.points = self.points;
						document.dispatchEvent(self.pEvent);
					}, function(t, e) {
						// couldn't read database
						alert(e.message);
					});
		});
	},
	saveGameLastState : function(gameLastState, callback) {
		var self = this;
		if (!self.supportStorage()) {
			return;
		}

		self.db
				.readTransaction(function(t) {
					t
							.executeSql(
									'SELECT COUNT(*) AS c FROM gamelaststate',
									[],
									function(t, r) {
										var fTrans;
										if (r.rows.item(0).c == 0) {
											fTrans = function(t) {
												t
														.executeSql(
																"INSERT INTO gamelaststate(playDate, history, number, numberPlace, state) VALUES (?, ?, ?, ?, ?);",
																[
																		gameLastState.playDate,
																		gameLastState.history,
																		gameLastState.number,
																		gameLastState.numberPlace,
																		gameLastState.state ]);
											}
										} else {
											fTrans = function(t) {
												t
														.executeSql(
																"UPDATE gamelaststate SET playDate=?,history=?,number=?,numberPlace=?, state=?;",
																[
																		gameLastState.playDate,
																		gameLastState.history,
																		gameLastState.number,
																		gameLastState.numberPlace,
																		gameLastState.state ]);
											}
										}
										self.db.transaction(fTrans);
									}, function(t, e) {
										// couldn't read database
										alert(e.message);
									});
				});
	},
	loadGameLastState : function() {
		var self = this;
		self.dbHistory = null;
		if (!self.supportStorage()) {
			return null;
		}
		self.db.readTransaction(function(t) {
			t.executeSql('SELECT * FROM gamelaststate', [], function(t, r) {
				if (r.rows.length > 0) {
					self.dbHistory = new self.GameLastState(r.rows.item(0));
					self.hEvent.dbHistory = self.dbHistory;
					document.dispatchEvent(self.hEvent);
				}
			}, function(t, e) {
				// couldn't read database
				alert(e.message);
			});
		});		
	},
	savePointHist : function(pointHist, callback) {
		var self = this;
		if (!self.supportStorage()) {
			return;
		}
		self.db
				.readTransaction(function(t) {
					t
							.executeSql(
									'SELECT COUNT(*) AS c FROM pointhist WHERE playDate = ?',
									[ GAME_STORAGE.getStrDate(new Date()) ],
									function(t, r) {
										var fTrans;
										if (r.rows.item(0).c == 0) {
											fTrans = function(t) {
												t
														.executeSql(
																"INSERT INTO pointhist(playDate, pointsAmmount) VALUES (?, ?);",
																[
																		pointHist.playDate,
																		pointHist.pointsAmmount ]);
											}
										} else {
											fTrans = function(t) {
												t
														.executeSql(
																"UPDATE pointhist SET pointsAmmount=IFNULL(pointsAmmount, 0)+? WHERE playDate=?;",
																[
																		pointHist.pointsAmmount,
																		pointHist.playDate ]);
											}
										}
										self.db.transaction(fTrans);
										self.computeTotalPoints();
									}, function(t, e) {
										// couldn't read database
										alert(e.message);
									});
				});
	}

};

GAME_STORAGE.init();
