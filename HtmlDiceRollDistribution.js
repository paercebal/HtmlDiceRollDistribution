function postMessage(p_lambda)
{
    setTimeout(p_lambda, 250);
}

function byId(p_id)
{
   const o = document.getElementById(p_id);
   if(o == null) alert("Id [" + p_id + "] not found");
   return o;
}

function getValueById(p_id)
{
    return byId(p_id).value;
}

function getIntegerById(p_id)
{
    return parseInt(byId(p_id).value, 10);
}

function setValueById(p_id, p_value)
{
    byId(p_id).value = p_value;
}

function createArray(p_size, p_value)
{
    p_size = parseInt(p_size, 10);
    
    const a = new Array(p_size);
    
    for(let i = 0; i < a.length; ++i)
    {
        a[i] = p_value;
    }
    
    return a;
}

function DiceRoll(p_diceType, p_diceCount)
{
    p_diceType = parseInt(p_diceType, 10);
    p_diceCount = parseInt(p_diceCount, 10);

    this.m_diceType = p_diceType;
    this.m_diceCount = p_diceCount;
    this.m_result = createArray(this.m_diceCount, 1);
}

DiceRoll.prototype.nextRoll = function()
{
    for(let i = 0; i < this.m_result.length; ++i)
    {
        this.m_result[i] += 1;
        
        if(this.m_result[i] > this.m_diceType)
        {
            this.m_result[i] = 1;
            continue;
        }
        
        break;
    }
    
    return ! this.isAllOnes();
}

DiceRoll.prototype.howManyAnything = function(p_lambda)
{
    let result = 0;
    
    for(let i = 0; i < this.m_result.length; ++i)
    {
        if(p_lambda(this.m_result[i]))
        {
            ++result;
        }
    }
    
    return result;
}

DiceRoll.prototype.isAllOnes = function()
{
    return (this.m_diceCount == this.howManyAnything( (p_result) => { return p_result == 1; } ));
}

DiceRoll.prototype.howManySuccesses = function(p_difficulty)
{
    p_difficulty = parseInt(p_difficulty, 10);

    return this.howManyAnything( (p_result) => { return p_result >= p_difficulty; } );
}

DiceRoll.prototype.howManyNaturalCriticalFailure = function()
{
    return this.howManyAnything( (p_result) => { return p_result == 1; } );
}

DiceRoll.prototype.howManyNaturalCriticalSuccess = function()
{
    const diceType = this.m_diceType;
    return this.howManyAnything( (p_result) => { return p_result == diceType; } );
}

DiceRoll.prototype.getAggregatedResult = function(p_difficulty)
{
    p_difficulty = parseInt(p_difficulty, 10);

    const r = {};
    r.m_successes = this.howManySuccesses(p_difficulty);
    r.m_criticalFailures = this.howManyNaturalCriticalFailure();
    r.m_criticalSuccesses = this.howManyNaturalCriticalSuccess();
    return r;
}


function getDistribution(p_diceType, p_diceCount, p_difficulty)
{
    p_diceType = parseInt(p_diceType, 10);
    p_diceCount = parseInt(p_diceCount, 10);
    p_difficulty = parseInt(p_difficulty, 10);
    
    const distribution = createArray(p_diceCount + 1, 0);
    const diceRoll = new DiceRoll(p_diceType, p_diceCount);
    let total = 0;
    let max = 0;
    
    do
    {
        const r = diceRoll.getAggregatedResult(p_difficulty);
        distribution[r.m_successes] += 1;
        ++total;
        
        if(distribution[r.m_successes] > max)
        {
            max = distribution[r.m_successes];
        }
    }
    while(diceRoll.nextRoll());
    
    const o = {};
    o.distribution = distribution;
    o.total = total;
    o.max = max;
    return o;
}

function displayPercentage(p_value)
{
    p_value = parseFloat(p_value);
    p_value = parseInt(p_value * 10000, 10) / 100;
    return p_value;
}

const g_strId_TBody = "TBody";
const g_strId_DiceType = "DiceType";
const g_strId_DiceCount = "DiceCount";
const g_strId_Difficulty = "Difficulty";
const g_strId_BonusMalus = "BonusMalus";

function updateDistributionWidgetInputValue(p_idPrefix, p_Idinput, p_value)
{
    byId(p_Idinput).value = parseInt(byId(p_Idinput).value) + p_value;
    
    asynchronousUpdateDistributionWidget(p_idPrefix);
}

function updateDistributionWidget(p_idPrefix)
{
    const diceType = getIntegerById(p_idPrefix + "_" + g_strId_DiceType);
    const diceCount = getIntegerById(p_idPrefix + "_" + g_strId_DiceCount);
    const difficulty = getIntegerById(p_idPrefix + "_" + g_strId_Difficulty);
    const rollBonusMalus = getIntegerById(p_idPrefix + "_" + g_strId_BonusMalus);

    if(isNaN(diceType) || isNaN(diceCount) || isNaN(difficulty) || isNaN(rollBonusMalus))
    {
        return;
    }

    const tbodyId = p_idPrefix + "_" + g_strId_TBody;

    const realDifficulty = difficulty - rollBonusMalus;
    
    const o = getDistribution(diceType, diceCount, realDifficulty);
    
    const html = [];

    html.push("<tr>");
    html.push("<th>Successes</th>");
    html.push("<th>Absolute</th>");
    html.push("<th>Relative</th>");
    html.push("<th>Relative Graph</th>");
    html.push("<th></th>");
    html.push("</tr>");

    const maxWidth = 200;

    for(let i = 0; i < o.distribution.length; ++i)
    {
        //const thisWidth = parseInt((o.distribution[i] / o.max) * maxWidth, 10);
        const thisWidth = parseInt((o.distribution[i] / o.total) * maxWidth, 10);
        const thisRemainingWidth = maxWidth - thisWidth;
        
        const style = (i % 2) ? "cssEven" : "cssOdd";
        const styleGraphYes = "min-width : " + thisWidth + "px";
        const styleGraphNo = "min-width : " + thisRemainingWidth + "px";
        
        const bar = "<span class=\"cssGraphYes\" style=\"" + styleGraphYes + "\">&#160;</span><span class=\"cssGraphNo\" style=\"" + styleGraphNo + "\">&#160;</span>";
        
        html.push("<tr class=\"", style, "\">");
        html.push("<th>", i, "</th>");
        html.push("<td class=\"cssRight\">", o.distribution[i],"</td>");
        html.push("<td class=\"cssRight\">", displayPercentage(o.distribution[i] / o.total)," %</td>");
        html.push("<td style=\"background-color : #FFFFFF;\">", bar, "</td>");
        html.push("<th>", i, "</th>");
        html.push("</tr>");
    }

    html.push("<tr>");
    html.push("<th>Total</th>");
    html.push("<td class=\"cssBlack cssRight\">", o.total, "</th>");
    html.push("<td class=\"cssBlack cssRight\">100 %</th>");
    html.push("<th></th>");
    html.push("<th></th>");
    html.push("</tr>");
    
    byId(tbodyId).innerHTML = html.join("");
}

function asynchronousUpdateDistributionWidget(p_idPrefix)
{
    postMessage(() => { updateDistributionWidget(p_idPrefix) });
}

function displayDistributionWidget(p_idPrefix, p_diceType, p_diceCount, p_difficulty, p_rollBonusMalus)
{
    const tbodyId = p_idPrefix + "_" + g_strId_TBody;
    const diceType = p_diceType;
    const diceCount = p_diceCount;
    const difficulty = p_difficulty;
    const rollBonusMalus = p_rollBonusMalus;
    
    const printInputLine = (p_idPrefix, p_idSuffix, p_label, p_value) =>
    {
        const id = p_idPrefix + "_" + p_idSuffix;
        
        const html = [];

        html.push("<tr>");
        html.push("<th></th>");
        html.push("<td colspan=\"1\" class=\"cssRight\">", p_label, "</td>");
        html.push("<td colspan=\"2\" class=\"cssLeft\">");
        html.push("  <button type=\"button\" onclick=\"updateDistributionWidgetInputValue('", p_idPrefix, "', '", id, "', -1);\">-</button>");
        html.push("  <input id=\"", id,"\"type=\"text\" size=\"3\" value=\"", p_value, "\" onkeyup=\"updateDistributionWidget('", p_idPrefix, "');\" />");
        html.push("  <button type=\"button\" onclick=\"updateDistributionWidgetInputValue('", p_idPrefix, "', '", id, "', +1);\">+</button>");
        html.push("</td>");
        html.push("<th></th>");
        html.push("</tr>");
        
        return html.join("");
    };
    
    const html = [];

    html.push("<table class=\"cssTable\">");
    html.push("<thead>");
    html.push("<tr>");
    html.push("<th colspan=\"5\">Input</th>");
    html.push("</tr>");
    html.push(printInputLine(p_idPrefix, g_strId_DiceType, "Dice Type", diceType));
    html.push(printInputLine(p_idPrefix, g_strId_DiceCount, "Dice Count", diceCount));
    html.push(printInputLine(p_idPrefix, g_strId_Difficulty, "DC", difficulty));
    html.push(printInputLine(p_idPrefix, g_strId_BonusMalus, "Bonus", rollBonusMalus));
    html.push("<tr>");
    html.push("<th colspan=\"5\">Output</th>");
    html.push("</tr>");
    html.push("</thead>");
    html.push("<tbody id=\"", tbodyId,"\">");

    html.push("<tbody>");
    html.push("</table>");
    
    byId(p_idPrefix).innerHTML = html.join("");

    asynchronousUpdateDistributionWidget(p_idPrefix);
}




