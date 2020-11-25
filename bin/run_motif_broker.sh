RUN_SCRIPT="/data/software/mobi/motif-broker/1.0.0/build/index.js"
LOGROOT="/data/www_prod/cstb/log/motif-broker"
MB_PORT="2346"
DB_URL="http://cstb_agent:8n9m4zY2kZtePvP@arwen-cdb.ibcp.fr"
DB_PORT="5984"
RULES="/data/www_prod/cstb/lib/4letters_prefix_rule_rc03.json"
SCREEN_NAME="motif-broker"

function start {
    echo "$(date) start motif-broker in $SCREEN_NAME screen"
    screen -dmS $SCREEN_NAME bash -c "node $RUN_SCRIPT -f $RULES -d $DB_URL -p $DB_PORT -l $MB_PORT > $LOGROOT.out 2> $LOGROOT.err"
}

function stop {
    echo "$(date) kill $SCREEN_NAME screen if exists"
    if [[ $(screen -list | grep -w $SCREEN_NAME) ]] ; then
        screen -XS $SCREEN_NAME quit
    fi
}

if [[ $1 == "restart" ]] ; then 
    stop
    start
elif [[ $1 == "stop" ]]; then
    stop
elif [[ $1 == "restart_loop" ]]; then
    stop
    start
    sleep 2
    while true; do
        pid_job=$(ps -edf | grep "[0-9] node " | grep $RUN_SCRIPT | awk '{print $2}')
        if [[ $pid_job == "" ]]; then
            echo "$(date) Process doesn't exist anymore. Restart screen"
            stop
			start
		fi
        sleep 10
    done
else 
    echo "launch the command with restart, stop or restart_loop option"
fi


