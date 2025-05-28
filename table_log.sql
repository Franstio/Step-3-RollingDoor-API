create table log_record(id int primary key auto_increment, id_transaction int null,recordDate datetime default Now(), detail text,IsSuccess bit default 0);
alter table log_record add foreign key(id_transaction) references transaction_id(id) on delete CASCADE
