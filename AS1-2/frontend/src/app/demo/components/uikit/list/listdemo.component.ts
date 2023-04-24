import { Component, OnInit } from '@angular/core';
import { Question } from 'src/app/models/question';
import { QuestionService } from 'src/app/services/question.service';
import { AuthService } from 'src/app/services/auth.service';
import { TagService } from 'src/app/services/tag.service';
import { Tag } from 'src/app/models/tag';

import { Router } from '@angular/router';
import { Message, MessageService } from 'primeng/api';


@Component({
    templateUrl: './listdemo.component.html',
    providers: [MessageService]
})
export class ListDemoComponent implements OnInit {

    question : Array<Question> = [];

    displayAddQuestion : boolean = false;

    questionRequest : Question = {
        title : '',
        body : '',
        author : '',
        timestamp : '',
        tags : [],
    }

    tagRequest : Tag = {
        name : '',
    }

    knowedTag : Array<string> = [];

    enteredTagsArray: string[] = [];
    tagsById: { [tagId: string]: Tag } = {};


    constructor(private Router : Router ,private service: MessageService, private QuestionService : QuestionService, private AuthService : AuthService, private TagService : TagService) { }

    ngOnInit(): void {
      this.TagService.get().subscribe({
          next: (tags: Array<Tag>) => {
            this.knowedTag = tags.map(tag => tag.name);
            tags.forEach(tag => {
              if (tag._id) {
                this.tagsById[tag._id] = tag;
              }
            });
          },
          error: (err: any) => {
              this.service.add({ key: 'tst', severity: 'error', summary: 'Error', detail: err.message });
          },
      });
  
      this.QuestionService.get().subscribe({
          next: (questions : Array<Question>) => {
              this.question = questions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());   
          },
          error: (err : any) => {
              this.service.add({ key: 'tst', severity: 'error', summary: 'Error', detail: err.message });
          }
      });
  }


    async addQuestion(): Promise<void> {
        this.questionRequest.timestamp = new Date().toISOString();
        this.questionRequest.author = this.AuthService.getUser().id;
    
        const enteredTags = this.enteredTagsArray.map((tag) => tag.trim());
        const tagIds: string[] = [];

        if (this.questionRequest.title == '' || this.questionRequest.body == '') {
            this.service.add({ key: 'tst', severity: 'error', summary: "Error", detail: 'Title and body are required' });
            return;
        }
        if (enteredTags.length == 0) {
            this.service.add({ key: 'tst', severity: 'error', summary: "Error", detail: 'At least one tag is required' });
            return;
        }
    
        for (const tagName of enteredTags) {
            const existingTag = await this.TagService.findTagByName(tagName).toPromise();
            let tagId;
        
            if (existingTag) {
              tagId = existingTag._id;
            } else {
              const newTag: Tag = { name: tagName };
              const createdTagMessage = await this.TagService.post(newTag).toPromise();
              if (createdTagMessage) {
                const createdTag = await this.TagService.findTagByName(tagName).toPromise();
                if (createdTag) {
                  tagId = createdTag._id;
                }
              }
            }
        
            if (tagId) {
              tagIds.push(tagId);
            }
          }
    
        this.questionRequest.tags = tagIds;
    
        this.QuestionService.post(this.questionRequest).subscribe({
            next: (question: Question) => {
                this.displayAddQuestion = false;
                this.question.push(question);
                this.ngOnInit();
                this.service.add({ key: 'tst', severity: 'success', summary: "Question added successfully" });
            },
            error: (err: any) => {
                this.service.add({ key: 'tst', severity: 'error', summary: err.message, detail: 'Error' });
            },
        });
    }

    showAddQuestionPopup(): void {
      if (this.AuthService.isLoggedIn()) {
          this.displayAddQuestion = true;
      } else {
          this.service.add({ key: 'tst', severity: 'error', summary: 'Error', detail: 'You must be logged in to add a question.' });
      }
  }

  navigateToQuestion(questionId: string): void {
    if (this.AuthService.isLoggedIn()) {
        this.Router.navigate(['/pages/empty', questionId]);
    } else {
        this.service.add({ key: 'tst', severity: 'error', summary: 'Error', detail: 'You must be logged in to view question details.' });
    }
}
    
    
}