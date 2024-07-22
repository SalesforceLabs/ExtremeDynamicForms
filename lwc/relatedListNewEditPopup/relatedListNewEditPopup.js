import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import relatedListResource from '@salesforce/resourceUrl/relatedListResource';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { NavigationMixin } from "lightning/navigation";

//export default class RelatedListNewEditPopup extends NavigationMixin(LightningElement) {
export default class RelatedListNewEditPopup extends LightningElement{
    showModal = false
    @api sobjectLabel
    @api sobjectApiName    
    @api recordId
    @api recordName

    @api show() {
        this.showModal = true;
    }

    @api hide() {
        this.showModal = false;
    }

    /* RT Selection [ */
    objectInfo;
    defaultrtvalue;
    selectRecordTypeId;

    showRecordForm = false;
    radioGroupOptions = [];

    @wire(getObjectInfo, { objectApiName: '$sobjectApiName'})
    wiredRecordTypes({ error, data }) {
        if(!this.recordId && this.radioGroupOptions.length == 0){
            if (data) {
                this.error = undefined;
                var recordtypeinfo = data.recordTypeInfos;
            
                for(var eachRecordtype in  recordtypeinfo)//this is to match structure of lightning combo box
                {
                    if(recordtypeinfo.hasOwnProperty(eachRecordtype) && !recordtypeinfo[eachRecordtype].master)
                        this.radioGroupOptions.push({ label: recordtypeinfo[eachRecordtype].name, value: recordtypeinfo[eachRecordtype].recordTypeId });

                    if(recordtypeinfo[eachRecordtype].defaultRecordTypeMapping){
                        this.defaultrtvalue = recordtypeinfo[eachRecordtype].recordTypeId;
                        this.selectRecordTypeId = this.defaultrtvalue;
                    }
                }
                //console.log('radioGroupOptions:' + JSON.stringify(this.radioGroupOptions));

            } else if (error) {
                this.error = error;
                this.objectInfo = undefined;
                this.showRecordForm = true;
                //this.createRecordStandard();
            }
        }

        //console.log('radioGroupOptions length:' + this.radioGroupOptions.length);

        if(this.radioGroupOptions.length == 0){
            this.showRecordForm = true;
            //this.createRecordStandard();
        }
        else{
            this.showRecordForm = false;
        }
    }


    get recordTypeList() {
      return this.radioGroupOptions;
    }

    handleRecordTypeChange(event){
        this.selectRecordTypeId = event.detail.value;
    }
    handleRecortTypeSave(){
        this.showRecordForm = true;
        //this.createRecordStandard();
    }

    createRecordStandard(){
        
        const defaultValues = {
            // Add your default field values here
        };

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: this.sobjectApiName,
                actionName: 'new'
            },
            state: {
                defaultFieldValues: defaultValues,
                recordTypeId: this.selectRecordTypeId
            }

        });
    }


    /* RT Selection [ */

    handleClose() {
        this.showModal = false;
        this.radioGroupOptions = [];

    }
    handleDialogClose(){
        this.handleClose()
    }

    isNew(){
        return this.recordId == null
    }
    get header(){
        return this.isNew() ? `New ${this.sobjectLabel}` : `Edit ${this.recordName}`
    }

    handleSave(){
        this.template.querySelector('lightning-record-form').submit();    
    }    
    handleSuccess(event){
        this.hide()
        let name = this.recordName
        if(this.isNew()){
            if(event.detail.fields.Name){
                name = event.detail.fields.Name.value
            }else if(event.detail.fields.LastName){
                name = [event.detail.fields.FirstName.value, event.detail.fields.LastName.value].filter(Boolean).join(" ")
            }
        } 
        name = name ? `"${name}"` : ''
        
        const message = `${this.sobjectLabel} ${name} was ${(this.isNew() ? "created" : "saved")}.`
        const evt = new ShowToastEvent({
            title: message,
            variant: "success"
        });
        this.dispatchEvent(evt);
        this.dispatchEvent(new CustomEvent("refreshdata"));                  
    }    

    renderedCallback() {
        loadStyle(this, relatedListResource + '/relatedListNewEditPopup.css')
    }         
}