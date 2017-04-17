

var IDE_HOOK = false;
var VERSION = '2.6.2';

//game parameters
var LIFE_START = 50;
var WARMUP = 30;
var INTERVAL = 60;
var INTERVAL_COMPLETED = 5;

//types
var SINGLE_TARGET = 0;
var AREA_TARGET = 1;

//useful stuff
var UID = 1;

var level = 0;
var timer;
var marker;

var game = new Phaser.Game(800, 704, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render });
var data;

var monsters = [];
var towers;
var bullets;
var money = 150;
var buildings = [];

//texts
var score;
var currentLevel;
var countdown;
var currentMoney;

function preload() 
{
    game.stage.disableVisibilityChange = true;

    game.load.json('data', 'data.json');
    game.load.image('tiles', 'img/tile.png');
    game.load.image('life', 'img/heart.png');
    game.load.image('coin', 'img/coin.png');

    //towers
    game.load.image('tower', 'img/tower.png');
    game.load.image('tower_earth', 'img/tower_earth.png');
    game.load.image('tower_elec', 'img/tower_elec.png');
    game.load.image('tower_fire', 'img/tower_fire.png');
    game.load.image('tower_nature', 'img/tower_nature.png');
    game.load.image('tower_magic', 'img/tower_magic.png');

    //monsters
    game.load.image('monster_devil', 'img/monster_devil.png');
    game.load.image('monster_earth', 'img/monster_earth.png');
    game.load.image('monster_elec', 'img/monster_elec.png');
    game.load.image('monster_fly', 'img/monster_fly.png');
    game.load.image('monster_human', 'img/monster_human.png');
    game.load.image('monster_magic', 'img/monster_magic.png');
    game.load.image('monster_mummy', 'img/monster_mummy.png');
}

function setUpMenu()
{
    var e = document.getElementById('towers');
    for (var i = 0; i < data.towers.length; i++) 
    {
        var img = document.createElement('img');
        img.src = 'img/' + data.towers[i].Image;
        img.alt = data.towers[i].Name;
        img.dataset.key = data.towers[i].Key; 
        img.onclick = function(e) {
                    displayStats(e);
            };
        e.appendChild(img);
    }
}

function selectPointer()
{
    var elements = document.getElementsByClassName("selected-menu");
    elements[0].classList.remove("selected-menu");

    var p = document.getElementById("pointer");
    p.className += "selected-menu";
}

function displayStats(e)
{
    var elements = document.getElementsByClassName("selected-menu");
    elements[0].classList.remove("selected-menu");

    var tower = data.towers.find(x => x.Key == e.target.dataset.key);
    e.target.className += "selected-menu";
    var html = '<b>Name:</b> ' + tower.Name + '<br>' +
               '<b>Damage:</b> ' + tower.Damage + '<br>' +
               '<b>Type:</b> ' + typeToString(tower.Type) + '<br>' +
               '<b>Targets:</b> ' + tower.Targets + '<br>' +
               '<b>Range:</b> ' + tower.Range + '<br>' +
               '<b>Attack speed:</b> ' + (Math.round(1000 / tower.ReloadTime * 100) / 100) + '<br>' +
               '<br>' +
               '<img src="img/coin.png" class="icon" /> ' + tower.Price + '<br>';
   var details = document.getElementById('details');
   details.innerHTML = html;
}

function showTowerStats(x, y)
{
    var tower = buildings[x + "_" + y];
    var html = '<div data-uid="' + tower.idx + '"><b>Name:</b> ' + tower.name + '<br>' +
               '<b>Damage:</b> ' + tower.damage + '<br>' +
               '<b>Type:</b> ' + typeToString(tower.type) + '<br>' +
               '<b>Range:</b> ' + tower.range + '<br>' +
               '<b>Attack speed:</b> ' + (Math.round(1000 / tower.reloadTime * 100) / 100) + '<br>' +
               '<br>' +
               '<b>Kills:</b> ' + tower.kills + '</div>';
    var details = document.getElementById('stats');
    details.innerHTML = html;
}

function updateTowerStats(uid, x, y)
{
    var e = document.querySelector('[data-uid="' + uid + '"]');
    if(e != null)
    {
        showTowerStats(x, y);
    }
}

function typeToString(type)
{
    switch(type)
    {
        case SINGLE_TARGET:
            return "Single target";
        case AREA_TARGET:
            return "Area damage";
    }
}

function create() {

    //database
    data = game.cache.getJSON('data');
    setUpMenu();

    game.stage.backgroundColor = '#2d2d2d';
    game.world.setBounds(0, 0, 800, 704);
    game.cache.addTilemap('dynamicMap', null, data.map, Phaser.Tilemap.CSV);
    map = game.add.tilemap('dynamicMap', 32, 32);
    map.addTilesetImage('tile', 'tiles', 32, 32);
    layer = map.createLayer(0);
    layer.resizeWorld();

    var heart = game.add.sprite(650, 30, 'life');
    heart.scale.set(0.6, 0.6);
    score = game.add.text(700, 36, LIFE_START, { fontWeight: 'bolder'});
    score.addColor('white', 0);

    var bitcoin = game.add.sprite(650, 80, 'coin');
    bitcoin.scale.set(0.6, 0.6);
    currentMoney = game.add.text(700, 80, money, { fontWeight: 'bolder'});
    currentMoney.addColor('white', 0);

    currentLevel = game.add.text(660, 130, "Level " + level, { fontWeight: 'bolder'});
    currentLevel.addColor('white', 0);

    var static = game.add.text(630, 190, "Next wave in", { fontWeight: 'bolder'});
    static.addColor('white', 0);

    countdown = game.add.text(667, 225, INTERVAL + " sec", { fontWeight: 'bolder'});
    countdown.addColor('white', 0);

    //create groups
    towers = game.add.group();
    bullets = game.add.group();
    bars = game.add.group();

    timer = new Timer(game, 1000, countdown, INTERVAL);
    timer.start(WARMUP);
    //drawChecks();

    marker = game.add.graphics();
    marker.lineStyle(2, 0x000000, 1);
    marker.drawRect(0, 0, 32, 32);
}

function buildTower(x, y, key)
{
    var tower = data.towers.find(x => x.Key == key);
    if(money < tower.Price)
    {
        return;
    }

    var sprite = game.add.sprite(x, y, tower.Key);
    sprite.scale.set(0.6, 0.6);
    sprite.idx = UID++;
    sprite.name = tower.Name;
    sprite.speed = tower.BulletSpeed;
    sprite.range = tower.Range;
    sprite.damage = tower.Damage;
    sprite.anchor.set(0.5, 0.5);
    sprite.reloadTime = tower.ReloadTime;
    sprite.reload = 0; //ready to shoot
    sprite.type = tower.Type;
    sprite.bulletColor = tower.BulletColor;
    sprite.kills = 0;
    sprite.targets = tower.Targets;

    money -= tower.Price;
    towers.add(sprite);
    buildings[x + "_" + y] = sprite;
}

function shootAtMonsters(tower)
{
    if(tower.reload > 0)
    {
        tower.reload -= game.time.elapsed;
        return;
    }
    var targets = 1;
    if(tower.type == AREA_TARGET)
    {
        targets = tower.targets;
    }

    var targetAcquired = 0;
    for (var i = 0; i < monsters.length ; i++) 
    {
        if(Phaser.Math.distance(monsters[i].x, monsters[i].y, tower.x, tower.y) <= tower.range)
        {
            shootAt(tower, monsters[i]);
            tower.reload = tower.reloadTime;
            targetAcquired++;
            if(targetAcquired == targets)
            {
                break;
            }
        }
    }
}

function shootAt(tower, monster)
{
    var g = game.add.graphics(0, 0);
    g.beginFill(tower.bulletColor, 2);
    g.drawCircle(0, 0, 3); //relative

    var bullet = game.add.sprite(tower.x, tower.y);
    bullet.addChild(g);
    bullet.damage = tower.damage;
    bullet.target = monster;
    bullet.type = SINGLE_TARGET;
    bullet.idx = UID++;
    bullet.speed = tower.speed;
    bullet.sender = tower;
    bullets.add(bullet);
}

function spawn()
{
    var hp = 50 + (Math.pow(level, 2) * 40);
    var value = 2 + (level);
    var type = data.monsters[level % 7];
    for (var i = 0; i < 20; i++) 
    {
        game.time.events.add(i * 500, spawnOne, this, hp, value, type);
    }
}

function spawnOne(hp, value, type)
{
    var sprite = game.add.sprite(176, 10, type);
    sprite.scale.set(0.3, 0.3);
    sprite.idx = UID++;
    sprite.hp = hp;
    sprite.maxHp = hp;
    sprite.speed = 0.5;
    sprite.value = value;
    sprite.path = 0;
    sprite.anchor.set(0.5, 0.5);

    var healthbar = game.add.graphics(0, 0);
    healthbar.beginFill(0xFF0000, 1);
    healthbar.drawRect(-40, -40, 80, 10);

    var hpbar = game.add.graphics(0, 0);
    hpbar.beginFill(0x00FF00, 1);
    hpbar.drawRect(-40, -40, 80, 10);

    sprite.hpbar = hpbar;
    sprite.healthbar = healthbar;

    sprite.addChild(healthbar);
    sprite.addChild(hpbar);

    monsters.push(sprite);
}

function drawHP(monster)
{
    var size = 80;
    var percent = Math.round(monster.hp / monster.maxHp * 10) / 10;
    monster.hpbar.destroy();

    var hpbar = game.add.graphics(0, 0);
    hpbar.beginFill(0x00FF00, 1);
    hpbar.drawRect(-40, -40, size * percent, 10)
    monster.addChild(hpbar);
    monster.hpbar = hpbar;
}

function moveOne(monster)
{
    var from = data.path[monster.path];
    var to = data.path[monster.path + 1]

    var moveX = to[0] - from[0];
    var moveY = to[1] - from[1];

    if(moveX > 0)
    {
        monster.x += monster.speed;
        if(monster.x >= to[0])
        {
            monster.path++;
        }
    }
    else if(moveX < 0)
    {
        monster.x -= monster.speed;
        if(monster.x <= to[0])
        {
            monster.path++;
        }
    }

    if(moveY > 0)
    {
        monster.y += monster.speed;
        if(monster.y >= to[1])
        {
            monster.path++;
        }
    }
    else if(moveY < 0)
    {
        monster.y -= monster.speed;
        if(monster.y <= to[1])
        {
            monster.path++;
        }
    }

    if(monster.path + 1 == data.path.length)
    {
        monsterEndsCircuit(monster);
    }
}

function removeHP(monster, amount, sender)
{
    monster.hp -= amount;
    if(monster.hp <= 0)
    {
        killMonster(monster, sender);
    }
    else
    {
        drawHP(monster);
    }
}

function killMonster(monster, sender)
{
    monster.destroy();
    var idx = monsters.findIndex(x => x.idx == monster.idx);
    if(idx > -1)
    {
        money += monster.value;
        sender.kills++;
        updateTowerStats(sender.idx, sender.x, sender.y);
        monsters.splice(idx, 1);
    }    
}

function monsterEndsCircuit(monster)
{
    monster.destroy();
    var idx = monsters.findIndex(x => x.idx == monster.idx);
    if(idx > -1)
    {
        monsters.splice(idx, 1);
        LIFE_START--;
    } 

    if(LIFE_START == 0)
    {
        game.destroy();
        var r = confirm("You loose! Retry?");
        if (r == true) 
        {
            location.reload();
        }
    }
}

function updateBullet(b)
{
    if(b.type == SINGLE_TARGET)
    {
        var direction = [b.target.x - b.x, b.target.y - b.y];

        b.x += direction[0] * b.speed * game.time.elapsed * 0.001;
        b.y += direction[1] * b.speed * game.time.elapsed * 0.001;
    }

    if(Phaser.Math.distance(b.x, b.y, b.target.x, b.target.y) <= 16)
    {
        removeHP(b.target, b.damage, b.sender);
        //play explosion
        bullets.remove(b);
    }
}

function nextRound()
{
    timer.start(INTERVAL);
    level++;
    spawn();
}

function handleMouse()
{
    //controls
    marker.x = layer.getTileX(game.input.activePointer.worldX) * 32;
    marker.y = layer.getTileY(game.input.activePointer.worldY) * 32;
    var tile = map.getTile(layer.getTileX(marker.x), layer.getTileY(marker.y));
    if(!tile || tile.index == -1)
    {
        marker.kill()   
    }
    else
    {
        marker.revive();
        marker.removeChildren();
        var currentSelection = document.getElementsByClassName("selected-menu")[0];
        var empty = (typeof buildings[(marker.x + 16) + "_" + (marker.y + 16)] === 'undefined');
        if(empty) 
        {
            var sprite = game.add.sprite(6, 6, currentSelection.dataset.key);
            sprite.scale.set(0.6, 0.6);
            marker.addChild(sprite);
        }

        if (game.input.mousePointer.isDown && empty && currentSelection.hasAttribute('data-key'))
        {
            buildTower(marker.x + 16, marker.y + 16, currentSelection.dataset.key);
        }
        else if(game.input.mousePointer.isDown && !empty && !currentSelection.hasAttribute('data-key'))
        {
            showTowerStats(marker.x + 16, marker.y + 16);
        }
    }
}

function update() 
{
    handleMouse();

    monsters.forEach(moveOne);
    towers.forEach(shootAtMonsters);
    bullets.forEach(updateBullet);

    //level cleared
    if(timer.timeElapsed >= INTERVAL_COMPLETED && level > 0 && monsters.length == 0)
    {
        timer.start(INTERVAL_COMPLETED);
        game.time.events.add(INTERVAL_COMPLETED, nextRound, this);
    }
    //no more time
    else if(timer.isOver())
    {
        nextRound();
    }
}

function render() {
    score.text = LIFE_START;
    currentLevel.text = "Level " + level;
    currentMoney.text = money;
}