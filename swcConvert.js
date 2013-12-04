/*jslint regexp: true, plusplus: true */
/*global module */

(function () {
    "use strict";
    
    var conversionRatio,
        specObj = {
            blankLine :     {regex: /^\r$/,
                              data: []},
            handInfo :      {regex: /^Hand #([\d\-]+) - (\d+-\d+-\d+) (\d+:\d+:\d+)/,
                              data: ['handNum', 'date', 'time']},
            gameInfo :      {regex: /^Game: (.*) \((\d+) - (\d+)\) - .* ([\d\.]+)\/([\d\.]+)/,
                              data: ['gameName', 'minBuyin', 'maxBuyin', 'smallBlind', 'bigBlind']},
            siteInfo :      {regex: /^Site: (.*)/,
                              data: ['siteName']},
            tableInfo :     {regex: /^Table: (.*)/,
                              data: ['tableName']},
            dealerInfo :    {regex: /^(.*) has the dealer button/,
                              data: ['dealerName']},
            holeCards :     {regex: /^\*\* Hole Cards \*\*/,
                              data: []},
            dealtTo :       {regex: /^Dealt to (.*) \[([\w\d]+) ([\w\d]+)\]/,
                              data: ['player', 'holeCard1', 'holeCard2']},
            flop :          {regex: /^\*\* Flop \*\* \[([\w\d]+) ([\w\d]+) ([\w\d]+)\]/,
                              data: ['flopCard1', 'flopCard2', 'flopCard3']},
            turn :          {regex: /^\*\* Turn \*\* \[([\w\d]+)\]/,
                              data: ['turnCard']},
            river :         {regex: /^\*\* River \*\* \[([\w\d]+)\]/,
                             data : ['riverCard']},
            showDown:       {regex: /^\*\* Pot Show Down \*\* \[([\w\d]+) ([\w\d]+) ([\w\d]+) ([\w\d]+) ([\w\d]+)\]/,
                              data: ['board']},
            
            /*** begin multiline ***/
            seatsInfo :     {regex: /^Seat (\d+): (.*) \(([\d\.]+)\)/,
                              data: ['seat', 'player', 'stackSize']},
            sBlindInfo :    {regex: /^(.*) posts small blind ([\d\.]+)/,
                              data: ['sBlindPlayer', 'sBlindAmt']},
            bBlindInfo :    {regex: /^(.*) posts big blind ([\d\.]+)/,
                              data: ['bBlindPlayer', 'bBlindAmt']},
            /*** end  multiline ***/
            
            /*** begin special actions ***/
            folds:           {regex: /^(.*) folds/,
                               data: ['player'],
                             action: true},
            calls:           {regex: /^(.*) calls ([\d\.]+)(.*)/,
                               data: ['player', 'amt', 'allin'],
                             action: true},
            bets:            {regex: /^(.*) bets ([\d\.]+)(.*)/,
                               data: ['player', 'amt', 'allin'],
                             action: true},
            checks:          {regex: /^(.*) checks/,
                               data: ['player'],
                             action: true},
            raises:          {regex: /^(.*) raises to ([\d\.]+)(.*)/,
                               data: ['player', 'amt', 'allin'],
                             action: true},
            betReturned:     {regex: /^Uncalled bet of (.*) returned to (.*)/,
                               data: ['amt', 'player'],
                             action: true},
            refunded:        {regex: /^(.*) refunded (\d)/,
                               data: ['player', 'amt'],
                             action: true},
            sidePotShowDown: {regex: /^\*\* Side Pot ([\d+]) Show Down \*\* \[([\w\d]+) ([\w\d]+) ([\w\d]+) ([\w\d]+) ([\w\d]+)\]/,
                               data: ['sidePotNum', 'board'],
                             action: true},
            mainPotShowDown: {regex: /^\*\* Main Pot Show Down \*\* \[([\w\d]+) ([\w\d]+) ([\w\d]+) ([\w\d]+) ([\w\d]+)\]/,
                               data: ['board'],
                             action: true},
            shows:           {regex: /^(.*) shows \[([\w\d]+ [\w\d]+)\] \((.*)\)/,
                               data: ['player', 'cards', 'hand'],
                             action: true},
            winsPotWithHand: {regex: /^(.*) wins Pot \((.*)\) with (.*)/,
                               data: ['player', 'amt', 'hand'],
                             action: true},
            winsPot:         {regex: /^(.*) wins Pot \((.*)\)/,
                               data: ['player', 'amt'],
                             action: true},
            winsSidePot:     {regex: /^(.*) wins Side Pot (\d+) \(([\d\.]+)\) with (.*)/,
                               data: ['player', 'sidePotNum', 'amt', 'hand'],
                             action: true},
            winsMainPot:     {regex: /^(.*) wins Main Pot \(([\d\.]+)\) with (.*)/,
                               data: ['player', 'amt', 'hand'],
                             action: true},
            addChips:        {regex: /^(.*) adds ([\d\.]+) chips/,
                               data: ['player', 'amt'],
                             action: true},
            rake:            {regex: /^Rake \((.*)\)/,
                               data: ['amt'],
                             action: true}
        };
    
    function getInfo(line, hand, type) {
        var index,
            match;
        
        if (!line || type === 'unknown') {
            return false;
        }
        
        hand[type] = {};
        match = line.match(specObj[type].regex);
        if (match) {
            for (index = 0; index < specObj[type].data.length; index++) {
                if (hand[type] && specObj[type] && specObj[type].data[index]) {
                    hand[type][specObj[type].data[index]] = match[index + 1];
                }
            }
        } else {
            return false;
        }
        
        return true;
    }
    
    function getLineType(line) {
        var type = 'unknown',
            match,
            i;
    
        if (line) {
            for (i in specObj) {
                if (specObj.hasOwnProperty(i)) {
                    match = line.match(specObj[i].regex);
                    if (match) {
                        type = i;
                    }
                }
            }
        }
    
        return type;
    }
    
    function getMultiLineInfo(lines, i, hand, action) {
        hand[action] = [];
        while (true) {
            var h = {};
            if (getInfo(lines[i++], h, action)) {
                hand[action].push(h[action]);
            } else {
                i--;
                break;
            }
        }
        
        return i;
    }
    
    function isEmpty(obj) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                return false;
            }
        }
    
        return true;
    }
    
    function getActions(lines, i) {
        var actionArr = [],
            actionObj,
            lineType;
    
        while (true) {
            actionObj = {};
            lineType = getLineType(lines[i]);
            if (lineType === 'unknown') {
                i++;
                break;
            }
            getInfo(lines[i], actionObj, lineType);
    
            if (specObj[lineType].action === true) {
                actionObj = actionObj[lineType];
                actionObj.action = lineType;
                actionArr.push(actionObj);
            } else {
                break;
            }
            i++;
        }
    
        return {actions: actionArr, i: i};
    }
    
    function chipsToDollars(chips) {
		return "$" + chips;
    }
    
    function specialActions(seatsInfo, actions, street) {
        var hh = '',
            j,
            k,
            shows;
    
        if (actions) {
            for (j = 0; j < actions.length; j++) {
                if (seatsInfo.player === actions[j].player) {
                    if (actions[j].action === 'folds') {
                        switch (street) {
                        case 'preflop':
                            hh += ' folded before the Flop';
                            break;
                        case 'flop':
                            hh += ' folded on the Flop';
                            break;
                        case 'turn':
                            hh += ' folded on the Turn';
                            break;
                        case 'river':
                            hh += ' folded on the River';
                            break;
                        default:

                        }
    
                        break;
                    }
                    if (actions[j].action === 'winsPot') {
                        shows = false;
                        for (k = 0; k < actions.length; k++) {
                            if (actions[k].action === 'shows' &&  actions[k].player === seatsInfo.player) {
                                hh += ' shows [' + actions[k].hand + '] and wins Pot';
                                shows = true;
                                break;
                            }
                        }
    
                        if (!shows) {
                            hh += ' collected (' + chipsToDollars(actions[j].amt) + '), mucked';
                        }
    
                        break;
                    }
                }
            }
        }
    
        return hh;
    }
    
    function parse(sealsHH) {
        var handArr = [],
            hand = {},
            street,
            lines = sealsHH.split('\n'),
            i = 0,
            lineType,
            actions;
        while (i < lines.length) {
            lineType = getLineType(lines[i]);
    
            switch (lineType) {
            case 'handInfo':
                getInfo(lines[i++], hand, 'handInfo');
                getInfo(lines[i++], hand, 'gameInfo');
                getInfo(lines[i++], hand, 'siteInfo');
                getInfo(lines[i++], hand, 'tableInfo');
                i = getMultiLineInfo(lines, i, hand, 'seatsInfo');
                break;

            case 'dealerInfo':
            case 'dealtTo':
                getInfo(lines[i++], hand, lineType);
                break;

            case 'flop':
            case 'turn':
            case 'river':
            case 'showDown':
            case 'sidePotShowDown':
            case 'mainPotShowDown':
                getInfo(lines[i++], hand, lineType);
                street = lineType;
                break;

            case 'holeCards':
                street = 'preflop';
                i++;
                break;

            case 'sBlindInfo':
            case 'bBlindInfo':
                i = getMultiLineInfo(lines, i, hand, lineType);
                break;

            case 'blankLine':
            case 'unknown':
                if (!isEmpty(hand)) {
                    handArr.push(hand);
                    hand = {};
                }
                i++;
                break;

            case 'folds':
            case 'checks':
            case 'calls':
            case 'bets':
            case 'raises':
            case 'shows':
            case 'winsPot':
            case 'winsPotWithHand':
            case 'winsSidePot':
            case 'winsMainPot':
            case 'betReturned':
            case 'rake':
                switch (street) {
                case 'preflop':
                case 'flop':
                case 'turn':
                case 'river':
                case 'showDown':
                case 'sidePotShowDown':
                case 'mainPotShowDown':
                    actions = getActions(lines, i);
                    hand[street + 'Actions'] = actions.actions;
                    i = actions.i;
                    break;

                case 'summary':
                    break;

                default:
                    i++;
                }
                break;
            default:
                i++;
            }
        }
        
        return handArr;
    }
    
    function actions(actionObj) {
        var i,
            hh = '',
            showsInfo;
    
        if (!actionObj) {
            return '';
        }
    
        for (i = 0; i < actionObj.length; i++) {
            switch (actionObj[i].action) {
            case 'folds':
                hh += actionObj[i].player + " folds\n";
                break;

            case 'checks':
                hh += actionObj[i].player + " checks\n";
                break;

            case 'calls':
                if (actionObj[i].allin) {
                    hh += actionObj[i].player + " calls " + chipsToDollars(actionObj[i].amt) + ", and is all in\n";
                } else {
                    hh += actionObj[i].player + " calls " + chipsToDollars(actionObj[i].amt) + "\n";
                }
                break;

            case 'bets':
                if (actionObj[i].allin) {
                    hh += actionObj[i].player + " bets " + chipsToDollars(actionObj[i].amt) + ", and is all in\n";
                } else {
                    hh += actionObj[i].player + " bets " + chipsToDollars(actionObj[i].amt) + "\n";
                }
                break;

            case 'raises':
                if (actionObj[i].allin) {
                    hh += actionObj[i].player + " raises to " + chipsToDollars(actionObj[i].amt) + ", and is all in\n";
                } else {
                    hh += actionObj[i].player + " raises to " + chipsToDollars(actionObj[i].amt) + "\n";
                }
                break;

            case 'addChips':
                hh += actionObj[i].player + " adds " + actionObj[i].amt + " chips\n";
                break;


            case 'refunded':
                hh += "Uncalled bet of " + chipsToDollars(actionObj[i].amt) + " returned to " + actionObj[i].player + "\n";
                break;

            case 'winsPot':
                hh += actionObj[i].player + " wins the pot (" + chipsToDollars(actionObj[i].amt) + ") \n";
                break;

            case 'winsPotWithHand':
                hh += actionObj[i].player + " wins the pot (" + chipsToDollars(actionObj[i].amt) + ") with " + actionObj[i].hand + "\n";
                break;

            case 'winsSidePot':
                hh += actionObj[i].player + " wins side pot " + actionObj[i].sidePotNum + " (" + chipsToDollars(actionObj[i].amt) + ") with " + actionObj[i].hand + " \n";
                break;

            case 'winsMainPot':
                hh += actionObj[i].player + " wins main pot (" + chipsToDollars(actionObj[i].amt)  + ") with " + actionObj[i].hand + " \n";
                break;

            case 'shows':
                showsInfo = actionObj[i].player + " shows [" + actionObj[i].cards + "] (" + actionObj[i].hand + ")\n";
                hh += showsInfo;
                break;

            default:
            }
        }
    
        return hh;
    }
    
    function format(h) {
        var i,
            j,
            k,
            hh = '',
            gameType,
            buttonSeatNum,
            totalPot,
            rake,
            rakePlaces,
            rh,
            totalPotWithRake,
            wins,
            winPotActions,
            winPotStrings;
        
        if (!h.gameInfo) {
            return false;
        }
        
        if (h.gameInfo.gameName === "NL Hold'em") {
            gameType = "No Limit Hold'em";
        } else if (h.gameInfo.gameName === "Limit Hold'em") {
            gameType = "Limit Hold'em";
        } else {
            return false;
        }
        
        hh += "Full Tilt Poker Game #" +
            h.handInfo.handNum.replace(/-/g, "") +
            ": " + h.tableInfo.tableName + " - " +
            chipsToDollars(h.gameInfo.smallBlind) + "/" +
            chipsToDollars(h.gameInfo.bigBlind) + " - " +
            gameType + " - " +
            h.handInfo.time + " ET - " +
            h.handInfo.date.replace(/-/g, "/") + "\n";
    
     
        for (i = 0; i < h.seatsInfo.length; i++) {
            hh += "Seat " + h.seatsInfo[i].seat + ": " + h.seatsInfo[i].player + " (" + chipsToDollars(h.seatsInfo[i].stackSize) + ")\n";
    
            if (h.seatsInfo[i].player === h.dealerInfo.dealerName) {
                buttonSeatNum = h.seatsInfo[i].seat;
            }
        }
    
        if (h.sBlindInfo) {
            for (i = 0; i < h.sBlindInfo.length; i++) {
                hh += h.sBlindInfo[i].sBlindPlayer + " posts the small blind of " + chipsToDollars(h.sBlindInfo[i].sBlindAmt) + "\n";
            }
        }
    
        if (h.bBlindInfo) {
            for (i = 0; i < h.bBlindInfo.length; i++) {
                hh += h.bBlindInfo[i].bBlindPlayer + " posts the big blind of " + chipsToDollars(h.bBlindInfo[i].bBlindAmt) + "\n";
            }
        }
    
        hh += "The button is in seat #" + buttonSeatNum + "\n";
        hh += "*** HOLE CARDS ***\n";
        if (h.dealtTo) {
            hh += "Dealt to " + h.dealtTo.player + " [" + h.dealtTo.holeCard1 + " " + h.dealtTo.holeCard2 + "]\n"; //todo change this to any players name not just mine
        }
        hh += actions(h.preflopActions);
    
        if (h.flop) {
            hh += "*** FLOP *** [" + h.flop.flopCard1 + " " + h.flop.flopCard2 + " " + h.flop.flopCard3 + "]\n";
            if (h.flopActions) {
                hh += actions(h.flopActions);
            }
        }
    
        if (h.turn && h.flop) {
            hh += "*** TURN *** [" + h.flop.flopCard1 + " " + h.flop.flopCard2 + " " + h.flop.flopCard3 + "] [" + h.turn.turnCard + "]\n";
            if (h.turnActions) {
                hh += actions(h.turnActions);
            }
        }
    
        if (h.river && h.turn && h.flop) {
            hh += "*** RIVER *** [" + h.flop.flopCard1 + " " + h.flop.flopCard2 + " " + h.flop.flopCard3 + " " + h.turn.turnCard + "] [" + h.river.riverCard + "]\n";
            if (h.riverActions) {
                hh += actions(h.riverActions);
            }
        }
    
        if (h.showDownActions) {
            hh += "*** SHOW DOWN ***\n";
            hh += actions(h.showDownActions);
        } else if (h.sidePotShowDownActions) {
            hh += "*** SHOW DOWN ***\n";
            for (i = 0; i < h.sidePotShowDownActions.length; i++) {
                if (h.sidePotShowDownActions[i].action === 'shows') {
                    hh += h.sidePotShowDownActions[i].player +
                        ' shows ' + h.sidePotShowDownActions[i].hand + '\n';
                } else if (h.sidePotShowDownActions[i].action === 'winsSidePot') {
                    hh += h.sidePotShowDownActions[i].player +
                        ' wins side pot ' + h.sidePotShowDownActions[i].amt +
                        ' with ' + h.sidePotShowDownActions[i].hand + '\n';
                }
            }
        }
    
        if (h.mainPotShowDownActions) {
            for (i = 0; i < h.mainPotShowDownActions.length; i++) {
                if (h.mainPotShowDownActions[i].action === 'shows') {
                    hh += h.mainPotShowDownActions[i].player +
                        ' shows ' + h.mainPotShowDownActions[i].hand + '\n';
                } else if (h.mainPotShowDownActions[i].action === 'winsMainPot') {
                    hh += h.mainPotShowDownActions[i].player +
                        ' wins main pot with ' + h.mainPotShowDownActions[i].hand + '\n';
                }
            }
        }
        
        winPotActions = [h.sidePotShowDownActions,
            h.mainPotShowDownActions,
            h.showDownActions,
            h.riverActions,
            h.turnActions,
            h.flopActions,
            h.preflopActions];
        
        winPotStrings = ['winsSidePot',
                        'winsMainPot',
                        'winsPot',
                        'winsPotWithHand'];
        
        totalPot = 0;
        for (i = 0; i < winPotActions.length; i++) {
            if (winPotActions[i]) {
                for (j = 0; j < winPotActions[i].length; j++) {
                    if (winPotActions[i][j]) {
                        for (k = 0; k < winPotStrings.length; k++) {
                            if (winPotActions[i][j].action === winPotStrings[k]) {
                                totalPot = winPotActions[i][j].amt;
                                break;
                            }
                        }
                    }
                    if (totalPot) {
                        break;
                    }
                }
            }
            
            if (totalPot) {
                break;
            }
        }
    
        hh += "*** SUMMARY ***\n";
        
        rake = null;
        rakePlaces = ['showDown', 'river', 'turn', 'flop'];
        for (i = 0; i < rakePlaces.length; i++) {
            rh = h[rakePlaces[i] + 'Actions'];
            if (rh) {
                for (i = 0; i < rh.length; i++) {
                    if (rh[i].action === 'rake') {
                        rake = rh[i].amt;
                        break;
                    }
                }
            }
        }
    
        totalPotWithRake = +totalPot + (+rake);
        hh += "Total pot " + chipsToDollars(totalPotWithRake) + " | Rake " + chipsToDollars(rake) + "\n";
    
        if (h.flop && h.turn && h.river) {
            hh += "Board: [" +
                h.flop.flopCard1 + " " +
                h.flop.flopCard2 + " " +
                h.flop.flopCard3 + " " +
                h.turn.turnCard + " " +
                h.river.riverCard + "]\n";
        } else if (h.flop && h.turn) {
            hh += "Board: [" +
                h.flop.flopCard1 + " " +
                h.flop.flopCard2 + " " +
                h.flop.flopCard3 + " " +
                h.turn.turnCard + "]\n";
        } else if (h.flop) {
            hh += "Board: [" +
                h.flop.flopCard1 + " " +
                h.flop.flopCard2 + " " +
                h.flop.flopCard3 + "]\n";
        }
    
        for (i = 0; i < h.seatsInfo.length; i++) {
            hh += 'Seat ' + h.seatsInfo[i].seat + ': ' + h.seatsInfo[i].player;
            hh += specialActions(h.seatsInfo[i], h.preflopActions, 'preflop');
            hh += specialActions(h.seatsInfo[i], h.flopActions, 'flop');
            hh += specialActions(h.seatsInfo[i], h.turnActions, 'turn');
            hh += specialActions(h.seatsInfo[i], h.riverActions, 'river');
    
            if (h.showDownActions) {
                for (j = 0; j < h.showDownActions.length; j++) {
                    if (h.seatsInfo[i].player === h.showDownActions[j].player) {
                        if (h.showDownActions[j].action === 'shows') {
                            wins = false;
                            for (k = 0; k < h.showDownActions.length; k++) {
                                if (h.seatsInfo[i].player === h.showDownActions[k].player &&
                                        (h.showDownActions[k].action === 'winsPot' || h.showDownActions[k].action === 'winsPotWithHand')) {
                                    hh += ' showed [' + h.showDownActions[j].cards + '] and won (' + chipsToDollars(h.showDownActions[k].amt) + ')';
                                    wins = true;
                                    break;
                                }
                            }
    
                            if (!wins) {
                                hh += ' showed [' + h.showDownActions[j].cards + '] and lost';
                            }
                        }
                    }
                }
            }
    
            hh += '\n';
        }
    
        return hh;
    }
    
    module.exports = {
        convert: function (data, chipRatio) {
            var i,
                fullTiltHH,
                handArr,
                thisHandHistory;
            
            if (typeof chipRatio !== 'undefined') {
                conversionRatio = chipRatio;
            } else {
                conversionRatio = 1;
            }
            handArr = parse(data);
    
            fullTiltHH = '\n\n';
            for (i = 0; i < handArr.length; i++) {
                thisHandHistory = format(handArr[i]);
                if (thisHandHistory) {
                    fullTiltHH += thisHandHistory + '\n\n\n';
                }
            }
            return fullTiltHH;
        }
    };
}());