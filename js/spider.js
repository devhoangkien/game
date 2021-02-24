function Spider(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'spider');

    // anchor
    this.anchor.set(0.5);
    // hoạt hình
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    // tính chất vật lý
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;

	// đối mặt và di chuyển sang phải
    this.body.velocity.x = Spider.SPEED;
	this.scale.x = -1;
}

Spider.SPEED = 100;

// Kế thừa từ Phaser.Sprite
Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () {
    // kiểm tra tường và hướng ngược lại nếu cần
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Spider.SPEED; // rẽ trái
		this.scale.x = 1;
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Spider.SPEED; // rẽ phải
		this.scale.x = -1;
    }
};

Spider.prototype.die = function () {
    this.body.enable = false;

    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
};
