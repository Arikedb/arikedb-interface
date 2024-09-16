import { Router, Request, Response } from 'express';
import { Variable, VariableType } from "@arikedb/core";

enum Status {
  OK = 'OK',
  ERROR = 'ERROR'
}

const router = Router();

router.get('/collections', (req: Request, res: Response) => {
  req.db_cli?.listCollections()
  .then((result) => {
    res.status(200)
    .json({
      status: Status.OK,
      message: 'Collections listed',
      data: {
        collections: result.collections
      }
    });
  })
  .then(() => {
    req.logger?.debug('Collections listed');
  }).catch((err) => {
    res.status(500)
    .json({
      status: Status.ERROR,
      message: 'Collections could not be listed',
      error: err
    });
    req.logger?.error(err);
  });
});

router.post('/collections', (req: Request, res: Response) => {
  req.db_cli?.createCollections(req.body.collection_names)
  .then((result) => {
    res.status(200)
    .json({
      status: Status.OK,
      message: 'Collections created'
    });
  })
  .then(() => {
    req.logger?.debug('Collections created');
  }).catch((err) => {
    res.status(500)
    .json({
      status: Status.ERROR,
      message: 'Collections could not be created',
      error: err
    });
    req.logger?.error(err);
  });
});

router.delete('/collections', (req: Request, res: Response) => {
  req.db_cli?.deleteCollections(req.body.collection_names)
  .then((result) => {
    res.status(200)
    .json({
      status: Status.OK,
      message: 'Collections deleted'
    });
  })
  .then(() => {
    req.logger?.debug('Collections deleted');
  }).catch((err) => {
    res.status(500)
    .json({
      status: Status.ERROR,
      message: 'Collections could not be deleted',
      error: err
    });
    req.logger?.error(err);
  });
});

router.get('/collections/:collection/variables', (req: Request, res: Response) => {
  req.db_cli?.listVariables(req.params.collection)
  .then((result) => {
    res.status(200)
    .json({
      status: Status.OK,
      message: 'Variables listed',
      data: {
        variables: result.variables
      }
    });
  })
  .then(() => {
    req.logger?.debug('Variables listed');
  }).catch((err) => {
    res.status(500)
    .json({
      status: Status.ERROR,
      message: 'Variables could not be listed',
      error: err
    });
    req.logger?.error(err);
  });
});

router.post('/collections/:collection/variables', (req: Request, res: Response) => {
  req.db_cli?.createVariables(
    req.params.collection,
    req.body.variables.map((variable_obj: any) => {
      return new Variable(
        variable_obj["name"],
        variable_obj.vtype as VariableType,
        variable_obj.buffer_size
      );
    })
  )
  .then((result) => {
    res.status(200)
    .json({
      status: Status.OK,
      message: 'Variables created'
    });
  })
  .then(() => {
    req.logger?.debug('Variables created');
  }).catch((err) => {
    res.status(500)
    .json({
      status: Status.ERROR,
      message: 'Variables could not be created',
      error: err
    });
    req.logger?.error(err);
  });
});

router.delete('/collections/:collection/variables', (req: Request, res: Response) => {
  req.db_cli?.deleteVariables(
    req.params.collection,
    req.body.variable_names
  )
  .then((result) => {
    res.status(200)
    .json({
      status: Status.OK,
      message: 'Variables deleted'
    });
  })
  .then(() => {
    req.logger?.debug('Variables deleted');
  }).catch((err) => {
    res.status(500)
    .json({
      status: Status.ERROR,
      message: 'Variables could not be deleted',
      error: err
    });
    req.logger?.error(err);
  });
});

router.post('/collections/:collection/variables/set', (req: Request, res: Response) => {
  req.db_cli?.setVariables(
    req.params.collection,
    req.body.variable_names,
    req.body.variable_values,
    req.body.timestamp,
    req.body.epoch
  )
  .then((result) => {
    res.status(200)
    .json({
      status: Status.OK,
      message: 'Variables set'
    });
  })
  .then(() => {
    req.logger?.debug('Variables set');
  }).catch((err) => {
    res.status(500)
    .json({
      status: Status.ERROR,
      message: 'Variables could not be set',
      error: err
    });
    req.logger?.error(err);
  });
});

router.post('/collections/:collection/variables/get', (req: Request, res: Response) => {
  req.db_cli?.getVariables(
    req.params.collection,
    req.body.variable_names,
    req.body.epoch
  )
  .then((result) => {
    res.status(200)
    .json({
      status: Status.OK,
      message: 'Variables getted',
      data: {
        points: result.datapoints
      }
    });
  })
  .then(() => {
    req.logger?.debug('Variables getted');
  }).catch((err) => {
    res.status(500)
    .json({
      status: Status.ERROR,
      message: 'Variables could not be getted',
      error: err
    });
    req.logger?.error(err);
  });
});

router.get('/collections/:collection/variables/subscribe', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const observable = req.db_cli.subscribeVariables(
    req.params.collection,
    JSON.parse(String(req.query.variable_names || "[]")),
    JSON.parse(String(req.query.events || "[]")),
  );

  const interval_ping = req.query.interval_ping ? Number(req.query.interval_ping) : 5000;

  const intervalId = setInterval(() => {
      res.write(`data: ${JSON.stringify({ message: 'ping' })}\n\n`);
  }, interval_ping);
  req.logger?.debug('Variables subscribed');

  const subscription = observable.subscribe({
    next: (data_point) => {
      req.logger?.debug('Streaming variable');
      res.write(`data: ${JSON.stringify(data_point)}\n\n`);
    },
    error: (err) => {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
      subscription.unsubscribe();
      req.logger?.error(err);
    },
    complete: () => {
      req.logger?.debug('Variables unsubscribed');
      clearInterval(intervalId);
      res.end();
    }
  });

  req.on('close', () => {
      req.logger?.debug('Variables unsubscribed');
      clearInterval(intervalId);
      subscription.unsubscribe();
      res.end();
  });
});

export default router;
