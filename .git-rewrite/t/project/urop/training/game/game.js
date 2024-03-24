document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1000; // 视角宽度
    canvas.height = 400; // 视角高度

    // 大地图尺寸
    const mapWidth = 3000;
    const mapHeight = 2000;
    const THRESHOLD_DISTANCE = 150; // 连接数

    let startTime = Date.now();

    let robot = {
        x: mapWidth / 2,
        y: mapHeight / 2,
        velocityX: 0,
        velocityY: 0,
        maxSpeed: 5,
        alive: true
    };

    let obstacles = []; // 存储障碍物的数组
    let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
    let endPoint = { x: Math.random() * mapWidth, y: Math.random() * mapHeight, size: 30 }; // 终点位置和大小

    let gameData = []; // 存储游戏数据

    // 在大地图上随机生成障碍物
    function createObstacles() {
        for (let i = 0; i < 200; i++) { // 生成更多障碍物以填充大地图
            let size = Math.random() * 30 + 20;
            let x = Math.random() * (mapWidth - size);
            let y = Math.random() * (mapHeight - size);
            let dx = Math.random() * 4 - 2; // 障碍物移动速度和方向
            let dy = Math.random() * 4 - 2;
            obstacles.push({ x, y, size, dx, dy });
        }
    }

    // 更新障碍物位置
    function updateObstacles() {
        obstacles.forEach(obstacle => {
            obstacle.x += obstacle.dx;
            obstacle.y += obstacle.dy;

            // 让障碍物在地图边界内反弹
            if (obstacle.x <= 0 || obstacle.x + obstacle.size >= mapWidth) {
                obstacle.dx *= -1;
            }
            if (obstacle.y <= 0 || obstacle.y + obstacle.size >= mapHeight) {
                obstacle.dy *= -1;
            }
        });
    }

    // 绘制机器人视角范围内的障碍物
    function drawObstaclesInView() {
        obstacles.forEach(obstacle => {
            let offsetX = obstacle.x - (robot.x - canvas.width / 2);
            let offsetY = obstacle.y - (robot.y - canvas.height / 2);
            if (offsetX + obstacle.size > 0 && offsetX < canvas.width && offsetY + obstacle.size > 0 && offsetY < canvas.height) {
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(offsetX, offsetY, obstacle.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function findNearestObstacle() {
        let nearestDistance = Infinity;
        let nearestObstacle = null;

        obstacles.forEach(obstacle => {
            let dx = obstacle.x - robot.x;
            let dy = obstacle.y - robot.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestObstacle = obstacle;
            }
        });

        return nearestObstacle;
    }

    function drawLinesToCloseObstacles() {
        obstacles.forEach(obstacle => {
            let dx = obstacle.x - robot.x;
            let dy = obstacle.y - robot.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < THRESHOLD_DISTANCE) {
                // 转换障碍物位置为相对于视角的坐标
                let offsetX = obstacle.x - (robot.x - canvas.width / 2);
                let offsetY = obstacle.y - (robot.y - canvas.height / 2);

                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, canvas.height / 2); // 从机器人位置开始
                ctx.lineTo(offsetX, offsetY);
                ctx.strokeStyle = 'yellow';
                ctx.stroke();
            }
        });
    }

    // 移动机器人
    function moveRobot() {
    if (!robot.alive) return;

    let dx = mousePos.x - canvas.width / 2;
    let dy = mousePos.y - canvas.height / 2;

    // 计算鼠标位置与机器人中心的距离
    let distance = Math.sqrt(dx * dx + dy * dy);

    // 如果鼠标位于机器人上（例如，距离小于一定阈值），则逐渐减速
    if (distance < 10) {
        robot.velocityX *= 0.9; // 减速效果
        robot.velocityY *= 0.9;
    } else {
        // 根据鼠标位置更新速度，调整加速度系数使之更小
        // 可以通过增加一个非线性因子来调整灵敏度
        let angle = Math.atan2(dy, dx);
        let accelerationFactor = 0.15; // 减小这个值以降低灵敏度
        let nonLinearFactor = 0.05; // 非线性因子，可以根据需要调整
        let adjustedDistance = Math.pow(distance, nonLinearFactor); // 应用非线性因子
        robot.velocityX += Math.cos(angle) * accelerationFactor * adjustedDistance;
        robot.velocityY += Math.sin(angle) * accelerationFactor * adjustedDistance;
    }

    // 限制最大速度
    let currentSpeed = Math.sqrt(robot.velocityX ** 2 + robot.velocityY ** 2);
    if (currentSpeed > robot.maxSpeed) {
        robot.velocityX = robot.velocityX / currentSpeed * robot.maxSpeed;
        robot.velocityY = robot.velocityY / currentSpeed * robot.maxSpeed;
    } else if (distance < 10 && currentSpeed < 0.05) { // 当速度非常小且鼠标在机器人上时，停止
        robot.velocityX = 0;
        robot.velocityY = 0;
    }

    robot.x += robot.velocityX;
    robot.y += robot.velocityY;

    // 限制机器人不超出地图边界
    robot.x = Math.max(0, Math.min(robot.x, mapWidth));
    robot.y = Math.max(0, Math.min(robot.y, mapHeight));

    checkCollision();
}


    // 绘制一条红色线，从画布中心到鼠标位置
    function drawLineToMouse() {
        ctx.beginPath();
        // 线条始于画布中心，即机器人的位置
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        // 线条终于鼠标当前位置，已经考虑了机器人相对于大地图的位置
        // 修正：直接使用 mousePos.x 和 mousePos.y，无需偏移量计算
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = 'red';
        ctx.stroke();
    }

    // 检查机器人与障碍物的碰撞
    function checkCollision() {
        obstacles.forEach(obstacle => {
            let dx = robot.x - (obstacle.x + obstacle.size / 2);
            let dy = robot.y - (obstacle.y + obstacle.size / 2);
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < obstacle.size / 2 + 10) {
				displayGameOverMessage(false);
                robot.alive = false;
            }
        });
    }

    // 绘制终点
    function drawEndPoint() {
        let offsetX = endPoint.x - (robot.x - canvas.width / 2);
        let offsetY = endPoint.y - (robot.y - canvas.height / 2);
        if (offsetX + endPoint.size > 0 && offsetX < canvas.width && offsetY + endPoint.size > 0 && offsetY < canvas.height) {
            ctx.fillStyle = 'green';
            ctx.fillRect(offsetX - endPoint.size / 2, offsetY - endPoint.size / 2, endPoint.size, endPoint.size);
        }
    }

    // 绘制指向终点的线
    function drawLineToEndPoint() {
        let offsetX = endPoint.x - robot.x;
        let offsetY = endPoint.y - robot.y;
        let distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        let distanceText = distance.toFixed(2) + ' units'; // 格式化距离值

        // 绘制线
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2); // 从机器人位置开始
        ctx.lineTo(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
        ctx.strokeStyle = 'blue';
        ctx.stroke();

        // 将文本位置设置在蓝线起点附近（机器人周围），但稍微偏移以避免与机器人图标重叠
        let textPosX = canvas.width / 2 + offsetX * 0.1; // 调整这个比例可以控制文本离机器人的距离
        let textPosY = canvas.height / 2 + offsetY * 0.1;

        // 旋转画布以使文本平行于线
        let angle = Math.atan2(offsetY, offsetX);
        ctx.save(); // 保存当前画布状态
        ctx.translate(textPosX, textPosY);
        ctx.rotate(angle);
        
        // 绘制文本
        ctx.fillStyle = 'blue';
        ctx.font = '14px Arial';
        ctx.fillText(distanceText, 5, -5); // 在蓝线旁边绘制文本，根据需要调整偏移量

        ctx.restore(); // 恢复画布到之前的状态
    }

    // 绘制机器人
function drawRobot() {
    ctx.fillStyle = robot.alive ? 'blue' : 'red'; // 机器人活着时为蓝色，否则为红色
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 10, 0, Math.PI * 2);
    ctx.fill();
}

    function drawMapBorder() {
        let leftEdge = Math.max(0, robot.x - canvas.width / 2);
        let rightEdge = Math.min(mapWidth, robot.x + canvas.width / 2);
        let topEdge = Math.max(0, robot.y - canvas.height / 2);
        let bottomEdge = Math.min(mapHeight, robot.y + canvas.height / 2);

        // 转换为视角内的坐标
        leftEdge -= robot.x - canvas.width / 2;
        rightEdge -= robot.x - canvas.width / 2;
        topEdge -= robot.y - canvas.height / 2;
        bottomEdge -= robot.y - canvas.height / 2;

        ctx.strokeStyle = '#000';
        ctx.strokeRect(leftEdge, topEdge, rightEdge - leftEdge, bottomEdge - topEdge);
    }
	
	function displayGameOverMessage() {
		let gameOverDiv = document.getElementById('gameOverMessage');
		gameOverDiv.textContent = '游戏结束'; // 在这里设置游戏结束时要显示的信息
}

    let previousSpeed = 0; // 存储上一个速度值

function updateGameInfo() {
    let gameTime = ((Date.now() - startTime) / 1000).toFixed(2);
    let speed = Math.sqrt(robot.velocityX ** 2 + robot.velocityY ** 2).toFixed(2);
    
    let dx = mousePos.x - canvas.width / 2;
    let dy = mousePos.y - canvas.height / 2;
    let distanceToMouse = Math.sqrt(dx * dx + dy * dy);
    
    let expectedAcceleration = (distanceToMouse / 100).toFixed(2);
    
    let nearestObstacle = findNearestObstacle();
    let distanceToNearestObstacle = nearestObstacle ? Math.sqrt((nearestObstacle.x - robot.x) ** 2 + (nearestObstacle.y - robot.y) ** 2).toFixed(2) : 'N/A';
    let distanceToEndPoint = Math.sqrt((endPoint.x - robot.x) ** 2 + (endPoint.y - robot.y) ** 2).toFixed(2);

    let robotPositionX = robot.x.toFixed(2);
    let robotPositionY = robot.y.toFixed(2);

    let realAcceleration = ((speed - previousSpeed) / 0.01).toFixed(2); // 在此假设每0.01秒更新一次速度
    previousSpeed = speed;

    let relativeSpeedToObstacle = 'N/A';
    if (nearestObstacle) {
        if (!nearestObstacle.initialDistance) {
            nearestObstacle.initialDistance = distanceToNearestObstacle;
        }
        let deltaDistance = nearestObstacle.initialDistance - distanceToNearestObstacle;
        let relativeSpeed = (deltaDistance / 0.01).toFixed(2) / 100;
        relativeSpeedToObstacle = relativeSpeed.toFixed(2);
    }

    // 将游戏数据添加到 gameData 数组中
    gameData.push({
        gameTime,
        robotPositionX,
        robotPositionY,
        endPointX: endPoint.x.toFixed(2),
        endPointY: endPoint.y.toFixed(2),
        distanceToEndPoint,
        speed,
        realAcceleration,
        expectedAcceleration,
        distanceToNearestObstacle,
        relativeSpeedToObstacle
    });

    // 更新表格内容
    let infoTable = `
        <table style="border-collapse: collapse;">
            <tr><td>Game Time:</td><td>${gameTime}</td></tr>
            <tr><td>Robot Position:</td><td>${robotPositionX}, ${robotPositionY}</td></tr>
            <tr><td>End Point Position:</td><td>${endPoint.x.toFixed(2)}, ${endPoint.y.toFixed(2)}</td></tr>
            <tr><td>Distance to End Point:</td><td>${distanceToEndPoint}</td></tr>
            <tr><td>Speed:</td><td>${speed}</td></tr>
            <tr><td>Real Acceleration:</td><td>${realAcceleration}</td></tr>
            <tr><td>Expected Acceleration:</td><td>${expectedAcceleration}</td></tr>
            <tr><td>Distance to Nearest Obstacle:</td><td>${distanceToNearestObstacle}</td></tr>
            <tr><td>Relative Speed to Obstacle:</td><td>${relativeSpeedToObstacle}</td></tr>
        </table>
    `;

    let infoDiv = document.getElementById('gameInfo');
    infoDiv.innerHTML = infoTable;

    // 将信息框定位到地图右下角
    infoDiv.style.position = 'absolute';
    infoDiv.style.bottom = '10px';
    infoDiv.style.right = '10px';
    infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    infoDiv.style.padding = '10px';

}

function calculateGameDataHash() {
    let jsonString = JSON.stringify(gameData);
    let hash = 0;
    if (jsonString.length == 0) return hash;
    for (let i = 0; i < jsonString.length; i++) {
        let char = jsonString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    // 将哈希值转换为十六进制格式并返回
    return hash.toString(16);
}


function saveGameData() {
    let csvContent = "data:text/csv;charset=utf-8,";

    // 遍历 gameData 数组，将游戏数据转换为 CSV 格式
    gameData.forEach(data => {
        let row = Object.values(data).join(",");
        csvContent += row + "\n";
    });

    return csvContent;
}

function downloadCSV() {
    let csvContent = saveGameData();
    let hashValue = calculateGameDataHash(); // 获取哈希值
    let encodedUri = encodeURI(csvContent);
    let fileName = `${formatDate()}-${hashValue}.csv`; // 将哈希值添加到文件名中
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    link.style.display = 'none'; // 隐藏元素

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


    // 格式化当前日期时间
    function formatDate() {
        let now = new Date();
        let month = (now.getMonth() + 1).toString().padStart(2, '0');
        let day = now.getDate().toString().padStart(2, '0');
        let year = now.getFullYear();
        let hours = now.getHours().toString().padStart(2, '0');
        let minutes = now.getMinutes().toString().padStart(2, '0');
        return `${month}-${day}-${year}-${hours}${minutes}`;
    }
	
// 生成CSV文件的超链接
function generateCSVLink() {
    let csvContent = saveGameData();
    let hashValue = calculateGameDataHash(); // 获取哈希值
    let encodedUri = encodeURI(csvContent);
    let fileName = `${formatDate()}-${hashValue}.csv`; // 将哈希值添加到文件名中
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    link.textContent = fileName; // 超链接显示的文本为文件名
    return link;
}


function displayGameOverMessage(success) {
    let gameOverDiv = document.getElementById('gameOverMessage');
    gameOverDiv.innerHTML = ''; // 清空游戏结束信息

    if (success) {
        // 添加成功信息
        let successMessage = document.createElement("span");
        successMessage.textContent = "Success! Please download ";

        // 添加CSV文件的超链接
        let csvLink = generateCSVLink();
        successMessage.appendChild(csvLink);

        // 添加文本
        successMessage.appendChild(document.createTextNode(" with the Hash Value "));

        // 添加哈希值
        let hashValueSpan = document.createElement("span");
        hashValueSpan.textContent = calculateGameDataHash();
        successMessage.appendChild(hashValueSpan);

        // 添加文本
        successMessage.appendChild(document.createTextNode(", please send .csv to "));

        // 添加邮件超链接
        let emailLink = document.createElement("a");
        emailLink.setAttribute("href", "mailto:guoyi@comp.nus.edu.sg");
        emailLink.textContent = "guoyi@comp.nus.edu.sg.";

        // 将邮件超链接添加到成功信息中
        successMessage.appendChild(emailLink);

        // 将成功信息添加到游戏结束信息中
        successMessage.style.color = 'green'; // 设置成功信息的字体颜色为绿色
        gameOverDiv.appendChild(successMessage);
    } else {
    // 添加失败信息
    let failureMessage = document.createElement("span");
    failureMessage.textContent = "Game Over! Your robot has no chance to survive! You can ";

    // 创建重新开始游戏的超链接
    let restartLink = document.createElement("a");
    restartLink.textContent = "REPLAY";
    restartLink.href = window.location.href; // 设置超链接地址为当前页面地址，即刷新页面

    // 创建学习游戏玩法的超链接
    let guideLink = document.createElement("a");
    guideLink.textContent = "Learn how to play!";
    guideLink.href = "https://www.comp.nus.edu.sg/~guoyi/project/urop/training/"; // 设置超链接地址为游戏玩法介绍页面

    // 将超链接添加到失败信息中
    failureMessage.appendChild(restartLink);
    failureMessage.appendChild(document.createTextNode(" or "));
    failureMessage.appendChild(guideLink);

    // 将失败信息添加到游戏结束信息中
    failureMessage.style.color = 'red'; // 设置失败信息的字体颜色为红色
    gameOverDiv.appendChild(failureMessage);
}
}





	
	

    function gameLoop() {
        if (!robot.alive) {
            saveGameData();
            return;
        }

        // 更新游戏信息
        updateGameInfo();

        // 检查机器人是否到达终点
        let distanceToEndPoint = Math.sqrt((endPoint.x - robot.x) ** 2 + (endPoint.y - robot.y) ** 2);
        if (distanceToEndPoint < endPoint.size / 2) {
			downloadCSV();
			displayGameOverMessage(true);
            robot.alive = false; // 停止游戏
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateObstacles();
        moveRobot();
        drawObstaclesInView();
        drawEndPoint();
        drawLineToEndPoint();
        drawRobot();
        drawLineToMouse();
        drawMapBorder();
        drawLinesToCloseObstacles(); // 绘制从机器人到满足条件的障碍物的黄线

        if (robot.alive) {
            requestAnimationFrame(gameLoop); // 继续游戏循环
        }
    }

    canvas.addEventListener('mousemove', function(event) {
        // 修正：直接获取鼠标相对于画布的位置
        mousePos.x = event.clientX - canvas.offsetLeft;
        mousePos.y = event.clientY - canvas.offsetTop;
    });

    createObstacles();
    requestAnimationFrame(gameLoop);
});
