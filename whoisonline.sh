#!/bin/bash

# just display all user, whith lastAccess in the last 10 minutes in the shell
psql osmbc -c "select data->>'OSMUser' as user,(data->>'lastAccess')::timestamp with time zone  as lastAccess from usert where (data->>'lastAccess')::timestamp with time zone  > current_timestamp - interval '10 minutes' order by lastAccess DESC;"

