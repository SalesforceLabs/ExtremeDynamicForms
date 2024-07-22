import { LightningElement, track, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import RelatedListHelper from "./relatedListHelper";
import {loadStyle} from 'lightning/platformResourceLoader';
import relatedListResource from '@salesforce/resourceUrl/relatedListResource';

export default class RelatedList extends NavigationMixin(LightningElement) {
    @track state = {}
    @api sobjectApiName;
    @api relatedFieldApiName;
    @api numberOfRecords = 10;
    @api sortedBy;
    @api sortedDirection = "ASC";
    @api rowActionHandler;
    @api fields;
    @api columns;
    @api customActions = [];
    @api invokedFromExperience;
    @api relatedListFilter;

    relatedlisterror;
    errorMsg;
    helper = new RelatedListHelper()

    renderedCallback() {
        loadStyle(this, relatedListResource + '/relatedList.css')
    }

    @api
    get recordId() {
        return this.state.recordId;
    }

    set recordId(value) {
        this.state.recordId = value;
        
        this.init();
    }
    get hasRecords() {
        return this.state.records != null && this.state.records.length;
    }

    async init() {
        this.state.showRelatedList = this.recordId != null;

        if (! (this.recordId
            && this.sobjectApiName
            && this.relatedFieldApiName
            && this.fields
            && this.columns)) {
            this.state.records = [];
            return;
        }

        console.log('>>>>>> relatedListFilter:',this.relatedListFilter);

        this.state.invokedFromExperience = this.invokedFromExperience;
        this.state.relatedListFilter = this.relatedListFilter;
        this.state.fields = this.fields
        this.state.relatedFieldApiName= this.relatedFieldApiName
        this.state.recordId= this.recordId
        this.state.numberOfRecords= this.numberOfRecords
        this.state.sobjectApiName= this.sobjectApiName
        this.state.sortedBy= this.sortedBy
        this.state.sortedDirection= this.sortedDirection
        this.state.customActions= this.customActions

        try{
            const data = await this.helper.fetchData(this.state);
            this.relatedlisterror = false;
            this.state.records = data.records;
            this.state.iconName = data.iconName;
            this.state.sobjectLabel = data.sobjectLabel;
            this.state.sobjectLabelPlural = data.sobjectLabelPlural;
            this.state.title = data.title;
            this.state.parentRelationshipApiName = data.parentRelationshipApiName;
            this.state.columns = this.helper.initColumnsWithActions(this.columns, this.customActions)
        }catch(error){
            this.relatedlisterror = true;
            this.state.showRelatedList = false;
            this.errorMsg = 'There was an error while fetching the related list for '+this.sobjectApiName;
            console.error('Related List data fetch failed. Error:', error);
        }
    }

    async doSorting(event){
        this.state.sortedBy = event.detail.fieldName;
        this.state.sortedDirection = event.detail.sortDirection;

        const data = await this.helper.fetchData(this.state);
        this.state.records = data.records;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (this.rowActionHandler) {
            this.rowActionHandler.call()
        } else {
            switch (actionName) {
                case "delete":
                    this.handleDeleteRecord(row);
                    break;
                case "edit":
                    this.handleEditRecord(row);
                    break;
                default:
            }
        }
    }

    handleGotoRelatedList() {
        this[NavigationMixin.Navigate]({
            type: "standard__recordRelationshipPage",
            attributes: {
                recordId: this.recordId,
                relationshipApiName: this.state.parentRelationshipApiName,
                actionName: "view",
                objectApiName: this.sobjectApiName
            }
        });
    }

    handleCreateRecord() {
        /*
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
                recordTypeId: '012J3000000sc5ZIAQ'
            }

        });
        */
        
        const newEditPopup = this.template.querySelector("c-related-list-new-edit-popup");
        newEditPopup.recordId = null
        newEditPopup.recordName = null        
        newEditPopup.sobjectApiName = this.sobjectApiName;
        newEditPopup.sobjectLabel = this.state.sobjectLabel;
        newEditPopup.show();
        
    }

    handleEditRecord(row) {

        const newEditPopup = this.template.querySelector("c-related-list-new-edit-popup");
        newEditPopup.recordId = row.Id;
        newEditPopup.recordName = row.Name?row.Name:this.state.sobjectLabel;
        newEditPopup.sobjectApiName = this.sobjectApiName;
        newEditPopup.sobjectLabel = this.state.sobjectLabel;
        newEditPopup.show();
    }

    handleDeleteRecord(row) {
        const newEditPopup = this.template.querySelector("c-related-list-delete-popup");
        newEditPopup.recordId = row.Id;
        newEditPopup.recordName = row.Name;
        newEditPopup.sobjectLabel = this.state.sobjectLabel;
        newEditPopup.show();
    }

    handleRefreshData() {
        this.init();
    }
}