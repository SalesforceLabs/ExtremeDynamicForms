/*****************************************************************************************************
* @Name         ExtremeDynamicFormsLwc
* @Author       Muralidhar Sampathirao
* @Year         2023
* @Description  The LWC generic component to build Dynamic Forms from EDF Configuration records.
******************************************************************************************************/
/* MODIFICATION LOG
* Version          Developer           Date               Description
*------------------------------------------------------------------------------------------------------
******************************************************************************************************/

/* eslint-disable guard-for-in */
/* eslint-disable @lwc/lwc/no-inner-html */
/* eslint-disable no-redeclare */
/* eslint-disable default-case */
/* eslint-disable no-extend-native */
/* eslint-disable no-useless-concat */
/* eslint-disable no-useless-return */
/* eslint-disable eqeqeq */
/* eslint-disable no-else-return */
/* eslint-disable vars-on-top */

import { LightningElement ,api, wire} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import GetFormMetadata from '@salesforce/apex/ExtremeDynamicFormsController.getFormMetadata';
import CUSTOM_TEMPLATE from './customTemplate.html';
import DEFAULT_TEMPLATE from './extremeDynamicFormsLwc.html';
import DEBUG_MODE_TEMPLATE from './debugModeTemplate.html';
import ACCORDIAN_TEMPLATE from './accordianTemplate.html';

import { CurrentPageReference } from 'lightning/navigation';
import IMAGES from "@salesforce/resourceUrl/ExtremeDynamicFormsStaticResource";

import EditLabel from '@salesforce/label/c.EDF_Edit_Button_Label';
import SaveLabel from '@salesforce/label/c.EDF_Save_Button_Label';
import CancelLabel from '@salesforce/label/c.EDF_Cancel_Button_Label';

import GetUserContextDecision from "@salesforce/apex/ExtremeDynamicFormsController.getUserContextDecision";

export default class ExtremeDynamicFormsLwc extends LightningElement {

    dynamicFormBuildingImage = IMAGES + '/EDF/images/form-loader.gif';
    dynamicFormBuildingFailedImage = IMAGES + '/EDF/images/decision-engine-failed.gif';

    label = {
        EditLabel,
        SaveLabel,
        CancelLabel
    };

    finalRecord=[];
    activeSections=[];
    currentRecordName;
    newRecordMode;
    readOnlyForm;

    oldValuesMap = {};
    
    editmode = true;

    formnotready = true;
    errorMessage='';
    decisionenginefailed = false;

    edfboundary = '-edfboundary'+Math.random()+'-';
    

    /* Related List [ */

    //DEPRECATED [
    @api contactColumns = [];
    //DEPRECATED ]

    /* Related List ] */


    @api recordId;
    @api formversion;
    @api usecustomtemplate = false;
    @api debugmode=false;
    @api userContextExpressionClass; //NOT USED
    @api usercontextclass;
    @api recordTypeId;

    @api invokedfromexperience=false;

    @wire(GetUserContextDecision,{userDecisionClass: '$usercontextclass',recordId:'$recordId'}) userContextDecision;

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
       if (currentPageReference && this.recordTypeId===undefined) {
          this.recordTypeId = currentPageReference.state?.recordTypeId;
       }
    }

    /*
    dynamicMethod = "methodName"

    methodName(event){
        this.mylog("Custom Dynamic Method invoked with event as ",event);
    }
    */

    _renderform;
    get renderform(){
        return (!this.formnotready && !this.decisionenginefailed);
    }

    /************************************ Custom Log Variables Starts *****************************/

    //runningMethod = 'LWC_FUNCTION';
    debug_filter = '** EDF Logs for **';
    _methodStackCount = 0;
    tabsUpdated = false;
    _tabs = '';
    TABSYMBOL = '   ';

    logError = false;

    totalLogsForMethod = {};
    runningMethodStack = [];

    methodEntryLogStyle = 'background: #0176D3; color: white;border-radius:10px 0px 0px 10px;padding:3px 8px 3px 8px';
    methodExitLogStyle = 'background: #0176D3; color: white;border-radius:0px 10px 10px 0px;padding:3px 25px 3px 8px';
    mnstyle = 'background: rgb(243, 243, 243); color: rgb(68, 68, 68);border-radius:10px 10px 10px 10px;padding:2px 5px 2px 5px;font-size:9px';


    skipMethods = ["sid","isAnumber","isAnOperator","isBraces","recursiveJsonParsing","check4Error","toPosfix","cleanPush","removeSpeclChars"];

    get tabs(){
        if(!this.tabsUpdated){
            this._tabs = '';
            for(let i=0; i<this._methodStackCount; i++){
                this._tabs = this._tabs + this.TABSYMBOL;
            }
            this.tabsUpdated = true;
        }
        return this._tabs;
    }

    set methodStackCount(value){
        this._methodStackCount = this._methodStackCount + value;
        this.tabsUpdated = false;
    }

    incorrectLogOrder(){
        if(this.logError){
            console.error(this.debug_filter+'There is an error in the way you have set up the custom logs. Please make sure every method entry is accompanied by a correcr method exit');
            return true;
        }
        return false;
    }

    logMethodEntry(methodName){
        if(this.incorrectLogOrder())
            return;

        if(!this.skipMethods.includes(methodName)){
            this.runningMethodStack.push(methodName);
            //this.runningMethod = methodName;
            this.methodStackCount = 1;

            this.totalLogsForMethod[methodName] = 0;

            //console.log('\n'+this.debug_filter+this.tabs+'==============================')
            console.log('\n');
            console.log(this.debug_filter+this.tabs+'%c'+methodName+'(){',this.methodEntryLogStyle);
        }
    }

    logMethodExit(methodName){
        if(this.incorrectLogOrder())
            return;

        if(!this.skipMethods.includes(methodName)){

            if(this.runningMethodStack.peek() == methodName){
                //this.runningMethod = methodName;
                //console.log(this.debug_filter,methodName,'=',this.totalLogsForMethod[methodName]);
                if(this.totalLogsForMethod[methodName] == 0){
                    console.log(this.debug_filter+this.TABSYMBOL+this.tabs+'%c'+'// no logs in this method','font-style:italic;color:grey');
                }
                this.totalLogsForMethod[methodName] = 0;
                console.log(this.debug_filter+this.tabs+'%c'+'}'+'%c'+' //closing tag for '+methodName,this.methodExitLogStyle,'font-size:10px;color:#0176D3;font-weight:bold');
                console.log('\n');

                this.runningMethodStack.pop();

                this.methodStackCount = -1;
            }
            else{
                this.logError = true;
                this.incorrectLogOrder();
                return;
            }
 
        }

    }

    mylog(msg,someobject=null,someobject2=null,someobject3=null){
        if(this.incorrectLogOrder())
            return;

        var currentMethod = this.runningMethodStack.peek();
        if(!this.skipMethods.includes(currentMethod)){
            this.totalLogsForMethod[currentMethod] = this.totalLogsForMethod[currentMethod]+1;
            console.log(this.debug_filter+this.TABSYMBOL+this.tabs+'%c'+(currentMethod===undefined?'ASYNC CALLBACK':currentMethod),this.mnstyle,msg,someobject?someobject:"",someobject2?someobject2:"",someobject3?someobject3:"");
        }
    }

    /*
    logError(msg){
        if(this.incorrectLogOrder())
            return;

        console.error('\n'+ msg + '\n');
        //console.log('\n'+this.tabs+'----------- In '+this.runningMethod+': Error Details - '+ error +' -----------\n');
    }
    */

    /************************************ Custom Log Variables Ends *****************************/

    /************************************ Decision Engine Variables Starts *****************************/
    
    fieldExpression = '';
    output = [];//array that holds the output in postfix notation
    stack = [];//stack for holding the operators during conversion
    infixAsToken = [];//array of fieldExpression as tokens

    resetDecisionVars(){
        this.output =[];
        this.stack = [];
        this.infixAsToken = [];
        this.temp = "";
    }
    
    operators = ["^", "*"];//holds array of operators
    braces = ["(", ")"];//host array of braces
    temp = "";
    error = false;//if there is an error this variable is set to true
    precedence = {"^":3, "*":2, "/":2, "+":1, "-":1, "(":0, ")":0};//holds an array of operators and their precedence value

    /************************************ Decision Engine Variables Ends *******************************/

    

    /*+++++++++++++++++++++++++++++++++++ Decision Engine Function Starts ++++++++++++++++++++++++++++++*/

    constructor(){
        super();
        Array.prototype.peek = function(){
            //this.mylog('Array Prototype:'+this.length);
            return this[this.length - 1];
        };
    }
    

    /**
    converts the this.fieldExpressioning to postfix
    **/
    convert2Tokens(){
        this.logMethodEntry('convert2Tokens');

        this.resetDecisionVars();

        //check if the first character is + or -
        if((this.fieldExpression.charAt(0) == "+") || (this.fieldExpression.charAt(0) == "-")){
            this.fieldExpression = "0" + this.fieldExpression;
        }
        
        //loop through all the values
        for(var i=0; i<this.fieldExpression.length; i++){
            //check if its an operator or a this.braces
            //Also checks if the this.temp buffer is empty. If its not, it pushes it unto the this.stack and emptys the this.temp
            if (this.isAnOperator(this.fieldExpression.charAt(i)) || this.isBraces(this.fieldExpression.charAt(i))){
                this.temp = this.temp.trim();
                if(this.temp.length !== 0){
                    this.infixAsToken.push(this.temp);
                    this.temp = "";
                }
                this.infixAsToken.push(this.fieldExpression.charAt(i));
                continue;
            }
            //if the character is a decimal no add it to the this.temp
            if(this.fieldExpression.charAt(i) == "."){
                this.temp = this.temp + ".";
                continue;
            }
            //if the character is a no, then add it to this.temp
            //if(!isNaN(this.fieldExpression.charAt(i))){
            this.temp = this.temp + this.fieldExpression.charAt(i);
            continue;
            //}
        }//loop ends
        
        //check if there are still values in the this.temp after running through the array
        this.temp = this.temp.trim();
        if(this.temp.length !== 0){
            this.infixAsToken.push(this.temp);
            this.temp = "";
        }
        this.mylog('TOKENS:'+this.infixAsToken);
        
        this.logMethodExit('convert2Tokens');
    }

    /**
    Checks if there are any this.error in the input
    **/
    check4Error(){
        this.logMethodEntry('check4Error');

        var prev = "op";//no or op
        var BracesList = [];
        var BracesOutput = [];
        
        for(var i = 0; i<this.infixAsToken.length; i++){
            if(!isNaN(this.infixAsToken[i])){//checks if its a no
                prev = "no";
                //this.mylog("no found");
                continue;
            }else if(this.isAnOperator(this.infixAsToken[i])){//checks if its an operator
                //this.mylog("op found");
                if(prev == "op"){//if the previous entry is an operator... this.error
                    this.error = true;
                    return true;
                }else{
                    prev = "op";//set previous to be an operator
                }
            }else if(this.isBraces(this.infixAsToken[i])){
                if(((this.infixAsToken[i] == "(") && (prev == "no")) || ((this.infixAsToken[i] == ")") && (prev == "op"))){
                    this.error = true;
                    return true;
                }
                //accumulate all the this.braces to be reviewed later
                BracesList.push(this.infixAsToken[i]);
            }
            else if(typeof this.infixAsToken[i]=="string"){//checks if its a no
                prev = "no";
                //this.mylog("no found");
                continue;
            }
            else{
                //this.mylog("other this.error");
                this.error = true;
                return true;
            }
        }
        
        //checks if the last digit is an operator. If true flag this.error
        if(this.isAnOperator(this.infixAsToken[this.infixAsToken.length - 1])){
            this.error = true;
            return true;
        }
        
        //this.mylog("no error yet");
        
        //check if any this.braces were found at all. if true, then check for errors withing them
        if(BracesList.length !== 0){
            //checks if the first brace found is ). If true, return this.error as true
            if(BracesList[0] ===  ")"){
                //this.mylog("first char this.error");
                this.error = true;
                return true;
            }
            //check if the this.braces are well arranged
            for(i=0; i<BracesList.length; i++){
                if(BracesList[i] == "("){
                    BracesOutput.push("(");
                }else{
                    if(BracesOutput.length === 0){
                        //this.mylog("len is zero");
                        this.error = true;
                        return true;
                    }else{
                        BracesOutput.pop();
                    }
                }
            }
            
            if(BracesOutput.length !== 0){
                this.error = true;
                return true;
            }
        }
        
        this.logMethodExit('check4Error');
        return false;//no this.error found
        
    }

    /**
    performs infix2postfix conversion
    **/
    toPosfix(){
        
        this.logMethodEntry('toPosfix');

        //loop through all the infixtokens
        for(var i = 0; i<this.infixAsToken.length; i++){
            if(this.isAnumber(this.infixAsToken[i])){//if its a no, push to the this.output this.stack
                this.cleanPush(this.output,this.infixAsToken[i]);
                
            }else if(this.isAnOperator(this.infixAsToken[i])){//if its an operator

                if(this.stack.length === 0){//if the this.stack is empty, push the new operator to the this.stack
                    this.stack.push(this.infixAsToken[i]);//push to this.stack

                }else{

                    //while whats at the top of the this.stack has greater this.precedence, pop it off to the this.output
                    while(this.precedence[this.stack.peek()] >= this.precedence[this.infixAsToken[i]]){
                        //if both the new entry and previous entry top of the this.stack are ^. Just push to this.output
                        if((this.infixAsToken[i] === "^") && (this.precedence[this.stack.peek()] === this.precedence[this.infixAsToken[i]])){
                            break;
                        }
                        this.cleanPush(this.output,this.stack.pop());
                        if(this.stack.length === 0){//after poping of, if the this.stack is now empty exit loop
                            break;
                        }
                    }
                    this.stack.push(this.infixAsToken[i]);
                }
            }else if(this.isBraces(this.infixAsToken[i])){//if its a this.braces
                if(this.infixAsToken[i] === "("){//if its a left brace, push into the this.stack
                    this.stack.push("(");
                }else{
                    while(this.stack.peek() != "("){//if its a right, pop off
                        
                        this.cleanPush(this.output,this.stack.pop());
                    }
                    this.stack.pop();//get the ( out of the this.stack
                }
            }
            else if(typeof this.infixAsToken[i]=="string"){
                this.cleanPush(this.output,this.infixAsToken[i]);
            }
        }
        if(this.stack.length !== 0){
            while(this.stack.length !== 0){
                this.cleanPush(this.output,this.stack.pop());
            }
        }
        
        this.logMethodExit('toPosfix');
        return this.output;//return the answer in postfix
    }

    cleanPush(arr,value){
        this.logMethodEntry('cleanPush');

        if(value==null || value== undefined || value.trim() == '')
            return;
        else
            arr.push(value);

        this.logMethodExit('cleanPush');
    }

    /**
    method is for performing the final calculation on the postfix
    and it returns the answer as a float
    **/
    getAns(){

        this.logMethodEntry('getAns');
        
        var no = 0;
        var tempAns;
        
        //count the no of this.operators and store it
        for(var i = 0; i<this.output.length; i++){
            if(this.isAnOperator(this.output[i])){
                ++no;
            }
        }
        
        //first loop for the no of this.operators found
        for(i = 0; i<no; i++){
            //run through the no of available values left
            for(var j = 0; j<this.output.length; j++){
                if(this.isAnOperator(this.output[j])){
                    tempAns = this.calculate(this.output[j - 2], this.output[j - 1], this.output[j]);
                    
                    this.output[j - 2] = tempAns;
                    this.output.splice((j - 1),2);
                    this.mylog("Partial Decision:"+this.output);
                    break;
                }
            }
        }
        //remove empty and undefined tokens
        this.output = this.output.filter(n=>n);

        this.logMethodExit('getAns');

        return this.output[0]?this.output[0]:false;
    }

    evalques(a, b, op){

        this.logMethodEntry('evalques');
        
        var ans;
        this.mylog("In evalques. LHS is:",a," and RHS is:",b);
        if(a!="" && a!=null && !isNaN(a))
            a=parseFloat(a);
        if(b!="" && b!=null && !isNaN(b))
            b=parseFloat(b);
        
        switch(op){
            case ">" : ans = (a > b)?true:false ;
            break;
            case "<" : ans = (a < b)?true:false ;
            break;
            case "=" : ans = (a == b)?true:false ;
            break;
            case "<=": ans = (a <= b)?true:false ;
            break;
            case ">=": ans = (a >= b)?true:false ;
            break;
            case "!=": ans = (a != b)?true:false ;
            break;
            case "~": ans = (a?.includes(b))?true:false ;
            break;
            case "!~": ans = (a?.includes(b))?false:true ;
            break;
        }
        this.mylog("{"+a+"} "+op+" {"+b+"} : "+ans);

        this.logMethodExit('evalques');

        return ans;
    }

    validEmail(email){

        this.logMethodEntry('validEmail');

        let isValidEmail = String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );

        this.logMethodExit('validEmail');

        return isValidEmail;
        
    }

    sanitizeExpression(expr){

        this.logMethodEntry('sanitizeExpression');

        this.mylog("Expression received in Sanitize is:"+expr.trim());
        if(expr.indexOf(">=") > 0){
            expr = expr.substring(0,expr.indexOf(">=")) + '|>=|' + expr.substring(expr.indexOf(">=")+2,expr.length);
        }
        else if(expr.indexOf("<=") > 0){
            expr = expr.substring(0,expr.indexOf("<=")) + '|<=|' + expr.substring(expr.indexOf("<=")+2,expr.length);
        }else if(expr.indexOf("!=") > 0){
            expr = expr.substring(0,expr.indexOf("!=")) + '|!=|' + expr.substring(expr.indexOf("!=")+2,expr.length);
        }
        else if(expr.indexOf("!~") > 0){
            expr = expr.substring(0,expr.indexOf("!~")) + '|!~|' + expr.substring(expr.indexOf("!~")+2,expr.length);
        }
        else if(expr.indexOf("<") > 0){
            expr = expr.substring(0,expr.indexOf("<")) + '|<|' + expr.substring(expr.indexOf("<")+1,expr.length);
        }else if(expr.indexOf(">") > 0){
            expr = expr.substring(0,expr.indexOf(">")) + '|>|' + expr.substring(expr.indexOf(">")+1,expr.length);
        }
        else if(expr.indexOf("=") > 0){
            expr = expr.substring(0,expr.indexOf("=")) + '|=|' + expr.substring(expr.indexOf("=")+1,expr.length);
        }
        else if(expr.indexOf("~") > 0){
            expr = expr.substring(0,expr.indexOf("~")) + '|~|' + expr.substring(expr.indexOf("~")+1,expr.length);
        }
        
        else{
        this.mylog("No operator found in:"+expr);

        }

        expr = this.removeSpeclChars(expr.trim());
        this.mylog('Expression after operator check run:'+expr);

        /* 30th May 2023 
        this.mylog('>>>>>>>>>>>>>>>>>> Expression after removing special characters:'+expr);

        const regex = /^\(\s*[A-z0-9_+-\/* ]+\s*(>=|<=|>|<|=|!=)\s*[A-z0-9_+-\/* ]+\s*\)$/g;
        const str = `(${expr})`;
        this.mylog('>>>>>>>>>>>>>>>>>> Expression Prep:'+str);
        let m;
        var sExpr='';
        
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            sExpr = expr.replace(m[1],"|"+m[1]+"|");
        }
        */
        var sExpr = expr;
        this.mylog('Final Sanitized Expression:'+sExpr);

        this.logMethodExit('sanitizeExpression');
        
        return sExpr;
    }

    removeSpeclChars(str){

        this.logMethodEntry('removeSpeclChars');
        
        if(str !=null && typeof str != 'undefined'){
            //this.mylog(">>>>>>>>>>Before - lhs/rhs:"+str);
            str = str.replace(/\(/g,"");
            str = str.replace(/\)/g,"");

            //Added after EDF
            str = str.replace(/"/g,this.edfboundary);
            //this.mylog(">>>>>>>>>>After - lhs/rhs:"+str);
        }

        this.logMethodExit('removeSpeclChars');
        return str;
    }

    getUserDecision(operand){
        this.logMethodEntry('getUserDecision');

        this.mylog('operand:',operand);

        if(typeof operand == 'boolean') {
            this.logMethodExit('getUserDecision');
            return operand;
        }
        let regex = /\{\{([^}]+)\}\}/g; // Regex for {{userContextExpression}}
        let matches = operand.match(regex);
        if(matches){
            if(this.usercontextclass===undefined || this.usercontextclass=='' || this.userContextDecision.error){
                if(this.usercontextclass===undefined || this.usercontextclass==''){
                    this.mylog('Expression has user context decision but the Decision Class is undefined');
                }

                if(this.userContextDecision.error){
                    this.mylog('Expression has user context decision but there is an error in the implementation class:'+this.usercontextclass,this.userContextDecision.error);
                }
                
                this.logMethodExit('getUserDecision');
                return operand;
            }
            else{
                this.mylog('Expression has user context decision. Expression evaluation from apex class '+this.usercontextclass+ ' is: '+this.userContextDecision.data);
                this.logMethodExit('getUserDecision');

                return this.userContextDecision.data;
            }
        }
        else{
            this.logMethodExit('getUserDecision');
            return operand;
        }
        
    }

    /**
    method do the calculation
    **/
    calculate(a, b, op){
        this.logMethodEntry('calculate');
        
        a = this.getUserDecision(a);
        b = this.getUserDecision(b);


        if(typeof a!="boolean"){
            
            a = this.sanitizeExpression(a);
            var lhsId = a.substring(0,a.indexOf("|"));
            // -- EDF var lhs = $("#"+lhsId+"_av").val();
            var lhs = this.valueFromRecordGear(lhsId);
            
            var rhs = a.substring(a.lastIndexOf("|")+1);
            var rhsHadDoubleQuotes = rhs.includes(this.edfboundary)?true:false;
            rhs = this.removeSpeclChars(rhs).trim().replaceAll(this.edfboundary,"");

            
            //30th May 2023 [
            if(rhs == "null"){
                this.mylog('^^^ rhs is NULL ^^^');
                rhs = null;
            }
            else if(!rhsHadDoubleQuotes && rhs!="" && isNaN(rhs)){
                this.mylog('^^^ rhs is an api ^^^');
                rhs = this.valueFromRecordGear(rhs);
            }
            else{
                this.mylog('^^^ rhs is a value ^^^');
            }
            //30th May 2023 ]
            

            var cop = a.substring(a.indexOf("|")+1,a.lastIndexOf("|"));
            
            lhs = this.removeSpeclChars(lhs);
            //rhs = this.removeSpeclChars(rhs).trim().replaceAll(this.edfboundary,"");
            
            this.mylog("Evaluating ","'"+lhsId.trim()+"'"+cop+"'"+rhs+"'");
            //a=eval("'"+lhs+"'"+cop+"'"+rhs+"'");
            a=this.evalques(lhs,rhs,cop);
            //a = this.evalques($("#"+a+"_av").val(),$("#"+a+"_dv").val(),$("#"+a+"_op").val());
        }
        if(typeof b!="boolean"){
            b = this.sanitizeExpression(b);
            var lhsId = b.substring(0,b.indexOf("|"));
            //-- EDF var lhs = $("#"+lhsId+"_av").val()
            var lhs = this.valueFromRecordGear(lhsId);
            
            var rhs = b.substring(b.lastIndexOf("|")+1);
            var rhsHadDoubleQuotes = rhs.includes(this.edfboundary)?true:false;
            rhs = this.removeSpeclChars(rhs).trim().replaceAll(this.edfboundary,"");

            //30th May 2023 [
            if(rhs == "null"){
                this.mylog('^^^ rhs is NULL ^^^');
                rhs = null;
            }
            else if(!rhsHadDoubleQuotes && rhs!="" && isNaN(rhs)){
                this.mylog('^^^ rhs is an api ^^^');
                rhs = this.valueFromRecordGear(rhs);
            }
            else{
                this.mylog('^^^ rhs is a value ^^^');
            }
            //30th May 2023 ]


            var cop = b.substring(b.indexOf("|")+1,b.lastIndexOf("|"));
            
            lhs = this.removeSpeclChars(lhs);
            //rhs = this.removeSpeclChars(rhs).trim().replaceAll(this.edfboundary,"");
            
            this.mylog('Evaluating ',"'"+lhsId.trim()+"'"+cop+"'"+rhs+"'");
            
            b=this.evalques(lhs,rhs,cop);
            
        }
        
        var ans;
        
        switch(op){
            case "^" : ans = (a | b)?true:false;
            break;
            case "*" : ans = (a & b)?true:false;
            break;
            
        }
        this.mylog(a+" "+(op=="*"?"AND":"OR")+" "+b+" : "+ans);

        this.logMethodExit('calculate');

        return ans;
    }


    /**
    checks if the character passed is a numer
    **/
    isAnumber= function(char){

        this.logMethodEntry('isAnumber');
        let check = !isNaN(char);
        this.logMethodExit('isAnumber');
        return check
    };

    /**
    checks if the character passed is an operator
    **/
    isAnOperator(char){
        this.logMethodEntry('isAnOperator');
        if(this.operators.indexOf(char) != -1){
            this.logMethodExit('isAnOperator');
            return true;
        }

        this.logMethodExit('isAnOperator');
        return false;
    }

    /**
    checks if character passed is a this.braces
    **/
    isBraces(char){
        this.logMethodEntry('isBraces');

        if(this.braces.indexOf(char) != -1){
        this.logMethodExit('isBraces');

            return true;
        }
        this.logMethodExit('isBraces');

        return false;
    }

    /*+++++++++++++++++++++++++++++++++++ Decision Engine Function Ends ++++++++++++++++++++++++++++++++*/

    data = {};

    getResolvedTarget(event){

        this.logMethodEntry('getResolvedTarget');

        let target ='[data-id="'+this.sid(event.target.fieldName)+'"]';
        if(this.template.querySelector(target) == null){
            //this.mylog('+++++++++++++++ No Input hidden field formed:');
            this.logMethodExit('getResolvedTarget');

            return event.target;
        }
        else{
            this.logMethodExit('getResolvedTarget');
            return this.template.querySelector(target);
        }


    }

    //sanitize id - remove _ (underscores)
    sid(_id){

        this.logMethodEntry('sid');
        if(_id.includes('_'))
        {
            this.logMethodExit('sid');
            return _id.replaceAll('_','-').toLowerCase().trim();
        }
        else{
            this.logMethodExit('sid');
            return _id.toLowerCase().trim();
        }
         
    }

    fieldNameFromMapper(fieldName){

        this.logMethodEntry('fieldNameFromMapper');

        let targetmapper = '[data-searchkey="'+this.sid(fieldName)+'"]';
        if(this.template.querySelector(targetmapper) != null){
            this.mylog("Check if Field "+fieldName + " has a custom record gear key");
            fieldName = this.template.querySelector(targetmapper).getAttribute('data-recgearkeymapping');
            this.mylog('New key is:'+fieldName);
        }
        else{
            this.mylog("Field "+fieldName+" doesn't have a custom key");
        }

        

        this.logMethodExit('fieldNameFromMapper');
        return fieldName;

    }

    valueFromRecordGear(fieldName,returnValueIfNull=null){

        this.logMethodEntry('valueFromRecordGear');

        fieldName = this.fieldNameFromMapper(fieldName);
        
        let target ='[data-id="'+this.sid(fieldName)+'"]';
        this.mylog('Finding Record Gear for value with target as:'+target);

        if(this.template.querySelector(target) == null){
            this.mylog(fieldName+' Fields Record gear not present');
            this.logMethodExit('valueFromRecordGear');

            return returnValueIfNull;
        }
        else{
            this.mylog(fieldName+' Fields value is:'+this.template.querySelector(target).value);
            this.logMethodExit('valueFromRecordGear');

            return this.template.querySelector(target).value;
        }

    }

    updateRecordGear(fieldName,newValue){

        this.logMethodEntry('updateRecordGear');


        let recordPointer = this.finalRecord.find(record => record.key === fieldName);
        if(recordPointer!=null){
            recordPointer.value = newValue;
        }
        else{
            this.mylog("No entry for field "+fieldName+" in finalRecord array");
        }
        

        /*
        this.finalRecord.forEach((obj)=>{
            
            if(obj.key == fieldName){
                this.mylog('**************** Updating finalRecord:',obj);
                obj.value = newValue;
            }
        });
        */
        
        
        let target ='[data-id="'+this.sid(fieldName)+'"]';

        if(this.template.querySelector(target) == null){
            let recordGearsDiv = this.template.querySelector('.recordgears');
            let cleanFieldName = encodeURIComponent(fieldName);
            recordGearsDiv.innerHTML = 
            recordGearsDiv.innerHTML+'<input data-id='+this.sid(cleanFieldName)+' key='+cleanFieldName+' value='+ encodeURIComponent(newValue)+' class="recordgear" type="hidden"/>';
            this.logMethodExit('updateRecordGear');

            return;
        }
        else{
            this.template.querySelector(target).value = newValue;
        }
        
        this.logMethodExit('updateRecordGear');
    }

    toggleFormElement(fieldName,show){

        this.logMethodEntry('toggleFormElement');

        let target ='[data-toggle="'+this.sid(fieldName)+'"]';
        this.mylog("Toggle call for "+fieldName+" with target as "+target+". Decision is to "+(show?"show":"hide")+" the field");
        if(this.template.querySelector(target) == null){
            this.logMethodExit('toggleFormElement');
            return;
        }
        if(show){
            //this.template.querySelector(target).classList.remove('edf-hide');
            //this.template.querySelector(target).classList.add('edf-show');
            let el =this.template.querySelector(target);
            el.classList.remove('slds-hide'); //SHOW

            /*
            let gearTarget ='[data-gearid="'+this.sid(fieldName)+'"]';
            let field_api_name =this.template.querySelector(gearTarget)?.getAttribute('data-fieldapi');

            this.mylog('field_api_name:',field_api_name);
            */

            let inputFieldTarget ='[data-fieldkey="'+this.sid(fieldName)+'"]';
            this.mylog('inputFieldTarget:',inputFieldTarget);

            let ifel =this.template.querySelector(inputFieldTarget);

            
            if(ifel != null){
                
                let actualrequired = ifel.getAttribute('data-actualrequired');
                this.mylog('actualrequired:',actualrequired);
                
                if(actualrequired==="true"){
                    ifel.required = true;
                    ifel.setAttribute('required',true);
                }
            }
        }
        else{
            //this.template.querySelector(target).classList.remove('edf-show');
            //this.template.querySelector(target).classList.add('edf-hide');
            

            /*
            let gearTarget ='[data-gearid="'+this.sid(fieldName)+'"]';
            let field_api_name =this.template.querySelector(gearTarget)?.getAttribute('data-fieldapi');
            this.mylog('field_api_name:',field_api_name);
            */


            let inputFieldTarget ='[data-fieldkey="'+this.sid(fieldName)+'"]';
            this.mylog('inputFieldTarget:',inputFieldTarget);
            

            let ifel =this.template.querySelector(inputFieldTarget);

            
            if(ifel != null){
                this.mylog('ifel.required:',ifel.required);
                ifel.removeAttribute('required');
                ifel.required = false;
            }

            let el = this.template.querySelector(target);
            el.classList.add('slds-hide'); //HIDE
        }

        this.logMethodExit('toggleFormElement');
    }
    
    handleInputFieldChange(event){

        this.logMethodEntry('handleInputFieldChange');

        let fieldName = event.target.fieldName;
        this.mylog('handleChange field:',fieldName);
        let finalValue = event.target.value;

        // Update multiple form elements with same field api if any[

        let otherFormElementTarget ='[data-key="'+this.sid(fieldName)+'"]';
        let otherFormElements = this.template.querySelectorAll(otherFormElementTarget);
        
        otherFormElements.forEach(otherFormElement=>{
            //this.mylog("Other Form Elements value with same Field API is:",otherFormElement?.value);
            otherFormElement.value = finalValue;
        });

        // ]

        /*
        this.mylog('------------------- handleChange Check if i can fetch attr:',event.target.getAttribute('data-key'));

        this.mylog('{{{{{{{{{{{{{{ - ',JSON.stringify(event.detail),'- }}}}}}}}}}}}}}}');
        this.mylog('{{{{{{{{{{{{{{ - ',JSON.stringify(event.target),'- }}}}}}}}}}}}}}}');
        */

        
        this.mylog("Value of field ",fieldName," when accessed from event.target.value is: ",finalValue);
        let valueFromGear = this.valueFromRecordGear(fieldName);
        
        this.mylog('What is typeof event.detail.value:',typeof event.detail.value);

        if(typeof event.detail.value == 'undefined'){
            this.mylog('Target is a composite field');
            let compositeField = JSON.parse(JSON.stringify(event.detail));
            this.mylog('Target Composite field looks like this:',compositeField);
            for(let key in compositeField){
                valueFromGear = this.valueFromRecordGear(fieldName+'.'+key);
                this.mylog("For key:"+key+" check if old value <",valueFromGear,"> = new value <",compositeField[key]+">");
                
                if(valueFromGear != compositeField[key] && valueFromGear!=null){
                    this.mylog('******* Not equal ******');
                    fieldName = fieldName+'.'+key;
                    finalValue = compositeField[key];
                    this.mylog('Final target is:'+fieldName+" = "+finalValue);
                    break;
                }
                
            }

        }

        fieldName = this.fieldNameFromMapper(fieldName);
        this.mylog('Final target after mapping is:'+fieldName);
        fieldName = fieldName.toLowerCase();

        //Saving old values to revert when user cancels so the decision engine can also revert the decision
        //Add only one time. No override.
        if(this.oldValuesMap[fieldName] === undefined){
            this.oldValuesMap[fieldName] = valueFromGear;
        }
        this.mylog('Saved Values:',this.oldValuesMap);

        this.updateRecordGear(fieldName,finalValue);
        this.callDecisionEngine(fieldName);

        
        this.mylog('handleChange new value:',finalValue);

        this.logMethodExit('handleInputFieldChange');

    }

    recursiveJsonParsing(rec,parentKey){

        this.logMethodEntry('recursiveJsonParsing');
        
        for(let key in rec){
            //this.mylog('key:'+parentKey+key);
            //this.mylog('value:'+rec[key]);
            if(typeof rec[key] == 'object' && rec[key]!=null){
                this.recursiveJsonParsing(rec[key],key+'.');    
            }
            else{
                var cleanParentKey = this.sid(parentKey);
                var cleanKey = this.sid(key);
                this.finalRecord = [...this.finalRecord, { cleankey:cleanParentKey+cleanKey,key : parentKey.toLowerCase()+key.toLowerCase(), value : rec[key] } ];
            }
        }

        this.logMethodExit('recursiveJsonParsing');
    }

    formatRecord(data){
        this.logMethodEntry('formatRecord');
        this.recursiveJsonParsing(data,'');
        this.logMethodExit('formatRecord');
    }

    formatDefinitions(data){

        this.logMethodEntry('formatDefinitions');

        this.mylog('Creating new form Definition:',data);
        data.forEach((obj)=>{
            //this.mylog('Map check:',obj.edf__Form_Elements__r?.records);
            this.activeSections.push(obj.Name);
            obj.columns = [];
            if(this.invokedfromexperience){
                let urlString = window.location.href;
                let baseURL = urlString.substring(0, urlString.indexOf("/s"));
                obj.url = baseURL+'/s/detail/'+obj.Id;
            }
            else{
                obj.url='/'+obj.Id;
            }

            /* Related List [ */
            if(obj.edf__Related_List_Container__c){
                let fields = [];

                obj.edf__Form_Elements__r?.records.forEach(form_element=>{

                    if(form_element.edf__Column_Type__c?.toLowerCase() == 'link'){
                        obj.columns.push({
                            "label":((form_element.edf__Custom_Label__c!='' && form_element.edf__Custom_Label__c!=null && form_element.edf__Custom_Label__c!==undefined)?form_element.edf__Custom_Label__c:"Name"),"fieldName":"LinkName", 
                            "type":"url", 
                            typeAttributes: { label: { fieldName: form_element.edf__Field_API_Name__c }, target: '_top' }
                        });
                        obj.sortedby = form_element.edf__Field_API_Name__c;
                        fields.push(form_element.edf__Field_API_Name__c);
                    }else{
                        obj.columns.push({
                            "label":form_element.edf__Custom_Label__c,
                            "fieldName":form_element.edf__Field_API_Name__c, 
                            "type":form_element.edf__Column_Type__c?.toLowerCase(),
                            "sortable":true
                        });
                        fields.push(form_element.edf__Field_API_Name__c);
                    }
                });
                obj.fields = fields.join();
            }
            else{
                obj.edf__Form_Elements__r?.records.forEach(form_element=>{
                    //this.mylog('Form Element Column:',form_element?.edf__Column__c);
                    form_element.edf__Record_Gear_Key_Mapping__c = form_element.edf__Record_Gear_Key_Mapping__c?.toLowerCase();
    
                    // New template code [
    
                    if(this.invokedfromexperience){
                        let urlString = window.location.href;
                        let baseURL = urlString.substring(0, urlString.indexOf("/s"));
                        form_element.url = baseURL+'/s/detail/'+form_element.Id;
                    }
                    else{
                        form_element.url='/'+form_element.Id;
                    }
    
                    if(form_element.edf__Column__c !== undefined){
                        
                        let colindex = form_element.edf__Column__c - 1;
                        for(let k = obj.columns.length; k <= colindex; k++){
                            obj.columns[k] =
                            {
                                columnkey: obj.Name+'-'+form_element.edf__Column__c,
                                records:[]
                            };
                        }
                        obj.columns[colindex].records.push(form_element);
                    }
                    
                    // New template code ]
    
                    obj.colsclass = "slds-col slds-size_1-of-"+obj.columns.length;
    
                    if(form_element?.edf__Custom_Label__c !== undefined){
                        form_element.hascustomlabel = true;
                    }
                    else{
                        form_element.hascustomlabel = false;
                    }
    
                });
            }
            /* Related List ] */

            
        });
        this.mylog('Mutated Definition:',data);
        this.mylog('this.activeSections:', this.activeSections);

        this.logMethodExit('formatDefinitions');

    }

    handleEdit(){
        this.logMethodEntry('handleEdit');
        this.editmode = true;
        this.logMethodExit('handleEdit');
    }

    handleCancel(){

        this.logMethodEntry('handleCancel');
        for(let key in this.oldValuesMap) {
            this.updateRecordGear(key,this.oldValuesMap[key]);
        }

        this.editmode = false;

        this.logMethodExit('handleCancel');
    }

    handleSuccess(event) {
        
        this.logMethodEntry('handleSuccess');
        this.oldValuesMap = {};
        const evt = new ShowToastEvent({
            title: 'Record Saved',
            message: 'Record ID: ' + event.detail.id,
            variant: 'success',

        });

        this.recordId = event.detail.id;
        this.newRecordMode = false;
        this.editmode = false;
        
        this.dispatchEvent(evt);
        this.logMethodExit('handleSuccess');
    }

    handleError(event) {

        this.logMethodEntry('handleError');
     
        console.error(this.debug_filter+'Error on Submit:',JSON.stringify(event.detail));
        const evt = new ShowToastEvent({
            title: 'Something went wrong while saving record',
            message: event.detail?.detail,//'Check form for error details',
            variant: 'error',

        });
        
        this.dispatchEvent(evt);

        this.logMethodExit('handleError');

    }

    connectedCallback(){

        if(this.formatDefinitions !== undefined){
            this.debug_filter = '** EDF Logs for '+this.formversion+' ** ';
        }
        
        this.logMethodEntry('connectedCallback');

        this.mylog('In EFD LWC Record Id is:'+this.recordId);
        this.mylog('In EFD LWC FormVersion is:'+this.formversion);

        if(this.recordId === undefined){
            this.editmode = true;
            this.newRecordMode = true;
        }
        else{
            this.editmode = false;
            this.newRecordMode = false;
        }
        
        GetFormMetadata({currentRecordId:this.recordId,formVersionName:this.formversion})
        .then((result) => {
            //this.mylog(' ----------- Form Metadata:', result);
            this.data = JSON.parse(result);
            this.mylog('this.data after Form Metadata fetch:', this.data);
            if(this.data.record.length>0){
                this.currentRecordName = this.data.record[0].attributes.type;
                this.mylog('currentRecordName:', this.currentRecordName);
                this.formatRecord(this.data.record[0],'');
            }
            else{
                
                this.mylog("No Record Id passed OR record doesn't exist");
                if(this.data.definition.length>0){
                    this.currentRecordName = this.data.definition[0].edf__Form_Definition_Version__r.edf__Form_Definition__r.edf__Object_API_Name__c;
                }
                this.mylog('currentRecordName from Form Definition:', this.currentRecordName);
            }

            if(this.data.definition.length>0){
                this.readOnlyForm = this.data.definition[0].edf__Form_Definition_Version__r.edf__Read_Only_Form__c;
                this.mylog('readOnlyForm from Form Definition:', this.readOnlyForm);
            }

            

            
            this.formatDefinitions(this.data.definition);
            this.mylog('finalRecord:',this.finalRecord);

            this.decisionenginefailed = false;
            this.formnotready = false;

        })
        .catch((error) => {
            console.error(this.debug_filter+'Form Metadata retrieval/processing failed!!. Error:', error);

            this.formnotready = false;
            this.decisionenginefailed = true;

            if(error.body !== undefined){
                this.errorMessage = 
                'Decision Engine could not build decision gears. '; 
                if(error.body.isUserDefinedException){
                    this.errorMessage = this.errorMessage + 'Reason: '+error.body.message;
                }
                else{
                    this.errorMessage = this.errorMessage + 'Reason: Unknown Server Error. Check console logs for more details';
                }
            }
            else{
                this.errorMessage = 
                'Decision Engine could not build decision gears. Reason: Unknown Component Error. Check console logs for more details';
            }
            
            /*'Please check if the Form Version: <b>' + 
            this.formversion + 
            '</b> is valid and all metadata records are in Active state.';
            */
        });

        this.logMethodExit('connectedCallback');
              
    }

    getDependentsFor(fieldName){

        this.logMethodEntry('getDependentsFor');

        let decisiongears = this.template.querySelectorAll('.decisiongear');
        let dependents = [];
        decisiongears.forEach(decisiongear=>{

            let anotherfield = decisiongear.getAttribute('data-fieldapi'); 
            let anotherfieldfekey = decisiongear.getAttribute('data-gearid'); 

            if(fieldName != anotherfield){
                this.mylog('-----------------------------------------------------------------------------');
                this.mylog("Check if field: "+ anotherfield +" ("+anotherfieldfekey+")"+" is dependent on "+fieldName);
                let anotherfieldexpr = decisiongear.getAttribute('data-expression').toLowerCase();
                this.mylog(anotherfield +' Expression is: '+anotherfieldexpr);
                if(anotherfieldexpr!= null && anotherfieldexpr.includes(fieldName)){
                    this.mylog(anotherfield+" ("+anotherfieldfekey+")"+" is a dependent for "+fieldName);
                    dependents.push(anotherfieldfekey);
                }
                else{
                    this.mylog(anotherfield+" ("+anotherfieldfekey+")"+" is NOT a dependent for "+fieldName);
                }
                this.mylog('-----------------------------------------------------------------------------');
            }
            

        });

        this.logMethodExit('getDependentsFor');
        return dependents;
       
    }

    flagDecisionEngine(flag){
        this.logMethodEntry('flagDecisionEngine');
        this.decisionenginefailed = flag;
        this.formnotready = !flag;
        this.logMethodExit('flagDecisionEngine');
    }

    evaluateGear(dependentFormElementKey){

        this.logMethodEntry('evaluateGear');

        this.mylog("Evaluate Gear entry:"+dependentFormElementKey);
        let dependentTargetByKey = '[data-gearid="'+this.sid(dependentFormElementKey)+'"]';
        this.mylog("Evaluate Gear search by:"+dependentTargetByKey);
        let dependentdecisiongear = this.template.querySelector(dependentTargetByKey);
        let dependent = dependentdecisiongear.getAttribute('data-fieldapi');

        this.mylog("Evaluating Gear for:"+dependentFormElementKey+" ("+dependent+")");


        //let dependentTarget = '[data-gearid="'+this.sid(dependent)+'"]';
        
        //let dependentdecisiongear = this.template.querySelector(dependentTarget);
        this.fieldExpression = dependentdecisiongear.getAttribute('data-expression');

        this.mylog("Expression for field "+dependentFormElementKey+" ("+dependent+")"+" is: "+this.fieldExpression);
        this.fieldExpression = this.fieldExpression.replaceAll('&&','*').replaceAll('||','^');

        if(!this.fieldExpression.includes("^") && !this.fieldExpression.includes("*")){
            this.mylog("Expression doesn't have a boolean operator.");
            this.fieldExpression=this.fieldExpression+"^"+this.fieldExpression;
            this.mylog("Expression after injecting 'OR' boolean operator: "+this.fieldExpression);
        }
        this.convert2Tokens();
                        
        var errorStatus = this.check4Error();
        if(errorStatus === true){
            console.error(this.debug_filter+'Expression Tokenization failed!!!');
            
        }else{
            this.mylog('POSTFIX:'+this.toPosfix());
            var finalDecision = this.getAns();
            this.mylog('Final Decision:'+finalDecision);
            this.toggleFormElement(dependentFormElementKey,finalDecision);
        }

        this.logMethodExit('evaluateGear');

    }


    callDecisionEngine(fieldName){

        this.logMethodEntry('callDecisionEngine');

        let dependents = this.getDependentsFor(fieldName);

        this.mylog("Dependent list for "+fieldName+": "+dependents);
        
        if(dependents!=null && dependents.length>0){
            dependents.forEach(dependent=>{
                this.evaluateGear(dependent);
               
            });
        }
        else{
            this.mylog("Field "+fieldName+" doesn't have any dependents");
        }

        this.logMethodExit('callDecisionEngine');      
    }

    allowChange(event){
        this.logMethodEntry('allowChange');
        this.mylog(' Record Value Changed:',event.detail);
        this.logMethodExit('allowChange');
    }

    render(){
        if(this.debugmode){
            return DEBUG_MODE_TEMPLATE;
        }
        return (this.usecustomtemplate)?ACCORDIAN_TEMPLATE:DEFAULT_TEMPLATE;
    }

    renderedCallback(){

        this.logMethodEntry('renderedCallback');

        try{
            let decisiongears = this.template.querySelectorAll('.decisiongear');
            decisiongears.forEach(decisiongear=>{
                this.evaluateGear(decisiongear.getAttribute('data-gearid'));
            });
            
        }catch(err){
            console.error(this.debug_filter,err);
            this.errorMessage = "Decision Engine Failed";
            this.decisionenginefailed = true;
        }

        this.logMethodExit('renderedCallback');

    }
}