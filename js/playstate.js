const LEVEL_COUNT = 6;

PlayState = {};

PlayState.init = function (data) {
	this.game.renderer.renderSession.roundPixels = true;
    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP
    });
	this.keys.up.onDown.add(function () {
		let didJump = this.hero.jump();
		if (didJump) {
			this.sfx.jump.play();
		}
	}, this);
	this.coinPickupCount = 0;
    this.hasKey = false;
    this.level = (data.level || 0) % LEVEL_COUNT;
};

PlayState.create = function () {
	const SFX_VOLUME = 0.1;
    this.game.add.image(0, 0, 'background');

    this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));
    this.sfx = {
        key: this.game.add.audio('sfx:key', SFX_VOLUME),
        door: this.game.add.audio('sfx:door', SFX_VOLUME),
        jump: this.game.add.audio('sfx:jump', SFX_VOLUME), //có thể điều chỉnh âm lượng lúc  tạo, nhưng còn khi chơi thì sao?
        coin: this.game.add.audio('sfx:coin', SFX_VOLUME),
		stomp: this.game.add.audio('sfx:stomp', SFX_VOLUME)
    };
    this._createHud();
};

PlayState.preload = function () {
    // Load dữ liệu level
    this.game.load.json('level:0', 'data/level00.json');
    this.game.load.json('level:1', 'data/level01.json');
    this.game.load.json('level:2', 'data/level02.json');
    this.game.load.json('level:3', 'data/level03.json');
    this.game.load.json('level:4', 'data/level04.json');
    this.game.load.json('level:5', 'data/level05.json');



    //Tải hình ảnh nền 
    this.game.load.image('background', 'images/background.png');

    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    this.game.load.image('grass:1', 'images/grass_1.png');


	this.game.load.image('invisible-wall', 'images/invisible_wall.png');

	// Load hình ảnh cửa và chìa khoá
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
	this.game.load.image('key', 'images/key.png');
    this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);

	// Load cửa và chìa khóa sfx
    this.game.load.audio('sfx:key', 'audio/key.wav');
    this.game.load.audio('sfx:door', 'audio/door.wav');

	//Tải hình ảnh nhân vật 
	this.game.load.spritesheet('hero', 'images/hero.png', 51, 50);

	// Load audio nhân vật sfx
    this.game.load.audio('sfx:jump', 'audio/jump.wav');
	this.game.load.audio('sfx:stomp', 'audio/stomp.wav');

	// nạp tiền xu
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);

	// nạp tiền xu sfx
    this.game.load.audio('sfx:coin', 'audio/coin.wav');

	// Tải hình ảnh quái - nhện
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 45);
	// Load UI images
	this.game.load.image('icon:coin', 'images/coin_icon.png');
    this.game.load.image('font:numbers', 'images/numbers.png');
};

PlayState.update = function () {
    this._handleCollisions();
    this._handleInput();
	this.coinFont.text = `x${this.coinPickupCount}`;
    this.keyIcon.frame = this.hasKey ? 1 : 0;
};

// Custom functions
PlayState._loadLevel = function (data) {
	// create all the groups/layers that we need
    this.bgDecoration = this.game.add.group(); // this needs to be first; ordering matters!
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.enemyWalls.visible = false;

	// spawn platforms
    data.platforms.forEach(this._spawnPlatform, this);

	// spawn characters
    this._spawnCharacters({hero: data.hero, spiders: data.spiders});

	// spawn coins
	data.coins.forEach(this._spawnCoin, this);

	// spawn door
    this._spawnDoor(data.door.x, data.door.y);

	// spawn key
    this._spawnKey(data.key.x, data.key.y);

    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._spawnPlatform = function (platform) {
    let sprite = this.platforms.create(
        platform.x, platform.y, platform.image);
    this.game.physics.enable(sprite);
	sprite.body.allowGravity = false;
	sprite.body.immovable = true;
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    // anchor and y displacement
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    // physic properties
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};

PlayState._spawnCharacters = function (data) {
    // spawn hero
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);

    // spawn spiders
    data.spiders.forEach(function (spider) {
        let sprite = new Spider(this.game, spider.x, spider.y);
        this.spiders.add(sprite);
    }, this);
};

PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    sprite.animations.add('rotate', [0, 1, 2, 3], 6, true); // 6fps, looped
    sprite.animations.play('rotate');
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;
    this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};

PlayState._handleInput = function () {
    if (this.keys.left.isDown) { // di chuyển trái
        this.hero.move(-1);
    } else if (this.keys.right.isDown) { // di chuyển phải
        this.hero.move(1);
    } else {
		this.hero.move(0);
	}
};

PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);
    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin,
        null, this);
    this.game.physics.arcade.overlap(this.hero, this.spiders,
        this._onHeroVsEnemy, null, this);
    this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey,
        null, this);
    this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor,
        // ignore if there is no key or the player is on air
        function (hero, door) {
            return this.hasKey && hero.body.touching.down;
        }, this);
};

PlayState._onHeroVsCoin = function (hero, coin) {
    coin.kill();
    this.sfx.coin.play();
    this.coinPickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
    if (hero.body.velocity.y > 0) { //giết kẻ thù khi anh hùng đang gục ngã
		hero.bounce();
		enemy.die();
        this.sfx.stomp.play();
    } else {
		this.sfx.stomp.play();
        this.game.state.restart(true, false, {level: this.level});
	}
};

PlayState._onHeroVsKey = function (hero, key) {
    this.sfx.key.play();
    key.kill();
    this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
    this.sfx.door.play();
    this.game.state.restart(true, false, { level: this.level + 1 });
};

PlayState._createHud = function () {
	// Set up coin counter
    const NUMBERS_STR = '0123456789X ';
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR, 6);

	// Set up key icon
    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

	// Set up coin icon
    let coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
    let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width,
        coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(0, 0.5);

	// Fill in the HUD
    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.add(this.keyIcon);
	this.hud.add(coinScoreImg);
    this.hud.position.set(10, 10);
};
