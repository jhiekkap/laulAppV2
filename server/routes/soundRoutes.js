const fs = require('fs')

const soundRoutes = (app) => {

    app.post('/api/files', async (req, res) => {
        console.log('TIME', new Date())
        console.log('req.title', req.title)
        try {
            if (!req.files) {
                console.log('NO FILE')
                res.send({
                    status: false,
                    message: 'No file uploaded',
                });
            } else {
                //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
                let newTrack = req.files.file;
                console.log('FILEE', newTrack)
                const names = newTrack.name.split('_')
                //Use the mv() method to place the file in upload directory (i.e. "uploads")
                const type = newTrack.mimetype === 'audio/mp3' ? '.mp3' : '.webm'
                const url = '/files/' + names[0] + '/' + names[1] + type
                newTrack.mv('./uploads' + url);
                //send response
                res.send({
                    status: true,
                    message: 'File is uploaded',
                    data: {
                        name: newTrack.name,
                        mimetype: newTrack.mimetype,
                        size: newTrack.size,
                        url,
                    }
                });

            }
        } catch (err) {
            res.status(500).send(err);
        }
    });

    app.delete('/api/files/:path',  (req, res) => {
        const path = req.params["path"].replace('_','/')
        console.log('DELETE PATH', path)
 
        /* try {
            //fs.unlinkSync('./uploads/files/' + path)
            const response = await fs.unlinkSync('./uploads/files/' + path)
            //file removed
            res.send(response)
        } catch (err) {
            console.error(err)
            res.send('ERROR', err)
        } */

        fs.unlink('./uploads/files/'+ path, (err) => {
            if (err) {
              console.error(err)
              res.send('ERRORI',err)
              return
            }
          res.send('ok')
            //file removed
          })

    })
};

module.exports = soundRoutes;