#!/bin/bash

# 定义颜色
GREEN='\033[0;32m'
NC='\033[0m' #颜色结束
SYSTEM_VERSION="TelegramBotChat管理系统 V1.01"

# 检查操作系统
function check_os() {
    if grep -qEi "(centos|fedora|red hat|redhat)" /etc/*release; then
        OS="CentOS"
    elif grep -qEi "(debian|ubuntu)" /etc/*release; then
        OS="Ubuntu/Debian"
    else
        echo "不支持的操作系统。"
        exit 1
    fi
    echo -e "${GREEN}操作系统检查完成: $OS${NC}"
}

# 显示系统类型
show_system_type() {
  echo "检查系统类型..."
  SYSTEM_TYPE=$(uname -s)
  echo "系统类型为: $SYSTEM_TYPE"
}

# 检查服务是否安装的函数，如果已安装则返回“已安装”，否则返回“未安装”
check_installed() {
  if command -v $1 &>/dev/null; then
    echo "已安装"
    return 1
  else
    echo "未安装"
    return 0
  fi
}
# 检查宝塔面板版本的函数，如果宝塔面板已安装，则显示其版本，否则显示“未安装”
check_bt_version() {
  if [ -f /www/server/panel/data/no_update.pl ]; then
    echo "已安装，版本：$(cat /www/server/panel/data/no_update.pl)"
    return 1
  else
    echo "未安装"
    return 0
  fi
}
# 安装宝塔面板的函数，使用官方提供的一键安装命令
install_bt() {
  echo "正在安装宝塔面板..."
  curl https://io.bt.sy/install/update_panel.sh | bash
  echo "宝塔面板安装完成。"
}
# 安装Nginx的函数，假设已经通过宝塔面板的安装脚本进行安装
install_nginx() {
  echo "正在安装Nginx..."
  bash /www/server/panel/install/install_soft.sh 0 install nginx 1.22
  echo "Nginx安装完成。"
}
# 安装MySQL的函数，同样假设通过宝塔面板进行安装
install_mysql() {
  echo "正在安装MySQL..."
  bash /www/server/panel/install/install_soft.sh 0 install mysql 5.7
  echo "MySQL安装完成。"
}
# 安装Node.js和Pm2的函数，根据操作系统的不同选择不同的安装命令
install_node_and_pm2() {
  echo "正在检查操作系统..."
  . /etc/os-release
  case "$ID" in
    ubuntu)
      echo "Ubuntu系统检测到，正在安装Node.js..."
      curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
      sudo apt-get install -y nodejs
      ;;
    centos)
      echo "CentOS系统检测到，正在安装Node.js..."
      wget https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.xz
      tar -xJf node-v18.17.0-linux-x64.tar.xz
      mv node-v18.17.0-linux-x64 /usr/node-js
      ln -s /usr/node-js/bin/npm /usr/local/bin/
      ln -s /usr/node-js/bin/node /usr/local/bin/
      ;;
    *)
      echo "不支持的操作系统"
      return 1
      ;;
  esac
  echo "正在安装Pm2..."
  npm install -g pm2
  echo "Node.js和Pm2安装完成。"
}
# 显示菜单的函数
show_menu() {
  clear
  echo "${SYSTEM_VERSION}"
  echo "-------------------------------------"
  echo "1｜宝塔面板｜$(check_bt_version)"
  echo "-------------------------------------"
  echo "2｜Nginx｜$(check_installed nginx)"
  echo "-------------------------------------"
  echo "3｜MySQL｜$(check_installed mysql)"
  echo "-------------------------------------"
  echo "4｜Node｜$(check_installed node)"
  echo "-------------------------------------"
  echo "5｜TelegramBot｜$(check_installed node)"
  echo "-------------------------------------"
  echo "q｜退出"
  echo "-------------------------------------"
  echo "请输入选项执行操作"
  echo "-------------------------------------"
}
# 主逻辑
while true; do
  show_menu
  # 这里可以根据用户输入执行不同的安装脚本或命令
  read -p "请选择要执行的操作(输入编号或'q'退出): " choice
  case $choice in
    # 这里填写编号对应的操作，例如
    1) echo
     if check_bt_version = 0; then
        check_bt_version
    else
      bash bt
    ;;
    2) echo
       if check_installed nginx  = 0; then
        install_nginx
      else
        check_installed nginx
    ;;
    3) echo
       if check_installed mysql  = 0; then
        install_MySQL
      else
        check_installed mysql
    ;;
    4) echo
       if check_installed node  = 0; then
        install_node_and_pm2
      else
        check_installed node
    ;;
    q) exit;;
    *) echo "无效输入!";;
  esac
  read -p "按任意键继续..." pause
done