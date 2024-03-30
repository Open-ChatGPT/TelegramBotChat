#!/bin/bash

SYSTEM_VERSION="TelegramBotChat管理系统 V1.01"
# 显示系统类型
show_system_type() {
  echo "检查系统类型..."
  SYSTEM_TYPE=$(uname -s)
  echo "系统类型为: $SYSTEM_TYPE"
}

# 检查服务安装状态的函数
check_installed() {
  if command -v $1 &>/dev/null; then
    echo "已安装"
  else
    echo "未安装"
  fi
}
# 检查Node版本
check_node_version() {
  if command -v node &>/dev/null; then
    echo "$(node -v)"
  else
    echo "未安装"
  fi
}
#安装服务
check_install(){
    if(bt){
    curl https://io.bt.sy/install/update_panel.sh|bash
    else if (Nginx){
    
    }
}
check_command(){
    #判断是否安装
    Install_Y_N = check_installed;
    #如果已安装则 输出已安装
    if(Install_Y_N === '已安装'{
        echo "已安装"
    else
        check_install
    }
}
# 显示菜单的函数
show_menu() {
  clear
  echo "${SYSTEM_VERSION}"
  echo "-------------------------------------"
  echo "编号｜宝塔面板｜$(check_installed bt)｜"
  echo "-------------------------------------"
  echo "编号｜Nginx  ｜$(check_installed nginx)｜"
  echo "-------------------------------------"
  echo "编号｜MySQL｜$(check_installed mysql)｜"
  echo "-------------------------------------"
  echo "编号｜Node｜$(check_node_version)｜"
  echo "-------------------------------------"
  echo "编号｜反向代理｜$(check_installed nginx)｜" # 仅示例，实际检查反向代理配置可能不同
  echo "-------------------------------------"
  echo "编号｜TelegramBot｜未安装｜未启动｜" # 需要实现检查逻辑
  echo "-------------------------------------"
  echo "一键安装安装"
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
     check_command bt
    ;;
    2) echo "安装Nginx...";;
    # 其他服务的安装命令...
    q) exit;;
    *) echo "无效输入!";;
  esac
  read -p "按任意键继续..." pause
done